import { AgentError } from './errors';
import { isAllowedBaseUrl, type Settings } from './settings';
import { isRecord } from '../lib/guards';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatRequest = {
  messages: readonly ChatMessage[];
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
};

export type AgentClient = {
  chat(settings: Settings, request: ChatRequest): Promise<string>;
  testConnection(settings: Settings): Promise<void>;
};

type FetchLike = typeof fetch;
type TimerClock = Pick<typeof window, 'setTimeout' | 'clearTimeout'>;

export const MAX_RESPONSE_CONTENT_CHARS = 64_000;
const MAX_REQUEST_TOKENS = 4_000;

const responseContent = (value: unknown): string | null => {
  if (!isRecord(value) || !Array.isArray(value.choices)) return null;
  const first: unknown = value.choices[0];
  if (!isRecord(first) || !isRecord(first.message) || typeof first.message.content !== 'string') {
    return null;
  }
  const content = first.message.content.trim();
  return content.length > 0 ? content : null;
};

const statusError = (status: number): AgentError => {
  if (status === 401 || status === 403) return new AgentError('auth');
  if (status === 404) return new AgentError('not-found');
  if (status === 429) return new AgentError('rate-limit');
  return new AgentError(status >= 500 ? 'server' : 'bad-response');
};

const explicitlyRejectsJsonMode = async (response: Response): Promise<boolean> => {
  if (response.status !== 400 && response.status !== 422) return false;
  try {
    const body = await response.text();
    return /response[_ -]?format|json[_ -]?mode|json_object/iu.test(body);
  } catch {
    return false;
  }
};

const validateConfig = (settings: Settings): void => {
  if (
    !isAllowedBaseUrl(settings.baseUrl) ||
    settings.model.length === 0 ||
    settings.apiKey.length === 0
  ) {
    throw new AgentError('config');
  }
};

export const createAgentClient = (
  fetchFn: FetchLike = fetch,
  clock: TimerClock = window,
): AgentClient => {
  const jsonModeUnsupported = new Set<string>();

  const chat = async (settings: Settings, request: ChatRequest): Promise<string> => {
    validateConfig(settings);
    const controller = new AbortController();
    const timer = clock.setTimeout(() => controller.abort(), request.timeoutMs ?? 30_000);
    const url = `${settings.baseUrl}/chat/completions`;

    try {
      const send = async (useJsonMode: boolean): Promise<Response> => {
        const body: Record<string, unknown> = {
          model: settings.model,
          messages: request.messages,
          max_tokens: Math.min(request.maxTokens ?? 1200, MAX_REQUEST_TOKENS),
        };
        if (useJsonMode) body.response_format = { type: 'json_object' };

        return fetchFn(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      };

      const wantsJsonMode = request.jsonMode === true && !jsonModeUnsupported.has(url);
      let response = await send(wantsJsonMode);
      if (!response.ok && wantsJsonMode && (await explicitlyRejectsJsonMode(response))) {
        jsonModeUnsupported.add(url);
        response = await send(false);
      }
      if (!response.ok) throw statusError(response.status);
      let decoded: unknown;
      try {
        decoded = (await response.json()) as unknown;
      } catch {
        throw new AgentError('bad-response');
      }
      const content = responseContent(decoded);
      if (content === null) throw new AgentError('bad-response');
      if (content.length > MAX_RESPONSE_CONTENT_CHARS) throw new AgentError('bad-response');
      return content;
    } catch (error: unknown) {
      if (error instanceof AgentError) throw error;
      if (controller.signal.aborted) throw new AgentError('timeout');
      throw new AgentError('network');
    } finally {
      clock.clearTimeout(timer);
    }
  };

  return {
    chat,
    async testConnection(settings: Settings): Promise<void> {
      await chat(settings, {
        messages: [
          { role: 'system', content: 'Reply with OK.' },
          { role: 'user', content: 'Connection test. Do not use stored or user content.' },
        ],
        maxTokens: 5,
        timeoutMs: 15_000,
      });
    },
  };
};
