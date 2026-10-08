export type AgentErrorCode =
  | 'config'
  | 'network'
  | 'auth'
  | 'not-found'
  | 'rate-limit'
  | 'timeout'
  | 'server'
  | 'bad-response'
  | 'invalid-json'
  | 'invalid-schema';

const messages: Record<AgentErrorCode, string> = {
  config: 'Add a valid provider, model, and API key in Settings.',
  network: 'The browser cannot reach the provider. Check browser access and the base URL.',
  auth: 'The key was rejected. Check Settings.',
  'not-found': 'The endpoint or model was not found. Check the base URL and model.',
  'rate-limit': 'The rate limit was reached. Wait and retry.',
  timeout: 'The provider took too long. You can retry or use the manual worksheet.',
  server: 'The provider had a temporary problem. You can retry or use the manual worksheet.',
  'bad-response': 'The provider returned an unreadable response. Use the manual worksheet.',
  'invalid-json': 'The response was not valid JSON. Use the manual worksheet.',
  'invalid-schema': 'The response did not match the required format. Use the manual worksheet.',
};

export class AgentError extends Error {
  readonly code: AgentErrorCode;

  constructor(code: AgentErrorCode) {
    super(messages[code]);
    this.name = 'AgentError';
    this.code = code;
  }
}
