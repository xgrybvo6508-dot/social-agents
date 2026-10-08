import { describe, expect, it, vi } from 'vitest';
import { createTaskExtractionMode } from '../modes/task-extraction';
import type { AgentClient } from './client';
import { AgentError } from './errors';
import { runMode } from './run-mode';
import { defaultSettings } from './settings';

const validTask = JSON.stringify({
  title: 'Draft outline',
  items: [
    {
      action: 'Draft the outline.',
      evidence: 'Please draft the outline.',
      owner: 'user',
      timing: null,
      confidence: 'stated',
      dependencies: [],
    },
  ],
  unknowns: [],
  nextAction: 'Draft the first section.',
});

const definition = createTaskExtractionMode({ sourceText: 'Please draft the outline.' });
if (!definition.ok) throw new Error('Test mode definition is invalid.');

const settings = { ...defaultSettings(), apiKey: 'not-a-real-key' };

const clientWith = (
  ...outputs: readonly (string | AgentError)[]
): {
  client: AgentClient;
  chat: ReturnType<typeof vi.fn<AgentClient['chat']>>;
} => {
  let index = 0;
  const chat = vi.fn<AgentClient['chat']>(() => {
    const output = outputs[index];
    index += 1;
    if (output instanceof AgentError) throw output;
    if (output === undefined) throw new Error('Unexpected extra request.');
    return Promise.resolve(output);
  });
  return {
    chat,
    client: { chat, testConnection: vi.fn(() => Promise.resolve()) },
  };
};

describe('mode runner', () => {
  it('returns only a validated response without repair', async () => {
    const { client, chat } = clientWith(validTask);
    const result = await runMode(client, settings, definition.value);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.repaired).toBe(false);
      expect(result.value.title).toBe('Draft outline');
    }
    expect(chat).toHaveBeenCalledOnce();
  });

  it('makes one repair request after invalid output', async () => {
    const { client, chat } = clientWith('not json', validTask);
    const result = await runMode(client, settings, definition.value);
    expect(result.status).toBe('success');
    if (result.status === 'success') expect(result.repaired).toBe(true);
    expect(chat).toHaveBeenCalledTimes(2);
    const repairRequest = chat.mock.calls[1]?.[1];
    expect(repairRequest?.messages.at(-1)?.content).toContain('VALIDATION ERRORS:');
    expect(repairRequest?.messages.at(-1)?.content).toContain('OUTPUT SCHEMA:');
    expect(repairRequest?.messages.at(-1)?.content).toContain('ORIGINAL OUTPUT:\nnot json');
  });

  it('stops after one failed repair and exposes no model text', async () => {
    const unsafe = '{"title":"Manipulate them","items":[],"unknowns":[],"nextAction":"Wait."}';
    const { client, chat } = clientWith(unsafe, unsafe);
    const result = await runMode(client, settings, definition.value);
    expect(result.status).toBe('manual-fallback');
    expect(chat).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(result)).not.toContain('Manipulate them');
    if (result.status === 'manual-fallback') {
      expect(result.error.code).toBe('invalid-schema');
    }
  });

  it('uses a typed manual fallback for transport failure without repair', async () => {
    const { client, chat } = clientWith(new AgentError('rate-limit'));
    const result = await runMode(client, settings, definition.value);
    expect(result.status).toBe('manual-fallback');
    expect(chat).toHaveBeenCalledOnce();
    if (result.status === 'manual-fallback') expect(result.error.code).toBe('rate-limit');
  });
});
