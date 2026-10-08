import { describe, expect, it } from 'vitest';
import { openDatabase } from './db';
import { createExport, serializeExport, type ExportEnvelope } from './export';
import type { Role } from './types';

const role = (id: string): Role => ({
  id,
  label: 'Teammate',
  description: 'A project teammate.',
  builtIn: false,
  createdAt: 1,
  updatedAt: 1,
});

describe('memory export', () => {
  it('builds a versioned envelope with ISO exportedAt', async () => {
    const db = await openDatabase(indexedDB, `export-${crypto.randomUUID()}`);
    await db.put('roles', role('role-export-1'));
    const envelope = await createExport(db, 1_700_000_000_000);
    expect(envelope).toMatchObject({
      app: 'social-agents',
      kind: 'memory-export',
      exportVersion: 1,
      schemaVersion: 1,
      exportedAt: '2023-11-14T22:13:20.000Z',
    });
    expect(envelope.data.roles).toHaveLength(1);
    const parsed = JSON.parse(serializeExport(envelope)) as ExportEnvelope;
    expect(parsed.data.roles[0]?.id).toBe('role-export-1');
    db.close();
  });

  it('refuses export when a stored record fails validation', async () => {
    const db = await openDatabase(indexedDB, `export-bad-${crypto.randomUUID()}`);
    const bad = role('role-bad');
    await db.put('roles', { ...bad, label: 'x'.repeat(200) });
    await expect(createExport(db)).rejects.toThrow(/invalid record/i);
    db.close();
  });
});
