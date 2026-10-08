import { describe, expect, it, vi } from 'vitest';
import { createAgentClient } from './client';
import { defaultSettings } from './settings';

describe('agent client', () => {
  it('sends the key only to the selected completion URL', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const settings = { ...defaultSettings(), apiKey: 'test-key' };
    await createAgentClient(fetchFn).chat(settings, {
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(`${settings.baseUrl}/chat/completions`);
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-key');
  });

  it('uses fixed content for a connection test', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }), {
        status: 200,
      }),
    );
    await createAgentClient(fetchFn).testConnection({
      ...defaultSettings(),
      apiKey: 'test-key',
    });
    const rawBody = fetchFn.mock.calls[0]?.[1]?.body;
    const body = JSON.parse(typeof rawBody === 'string' ? rawBody : '') as {
      messages: { content: string }[];
    };
    expect(JSON.stringify(body.messages)).not.toContain('memory');
    expect(body.messages[1]?.content).toContain('Connection test');
  });
});
