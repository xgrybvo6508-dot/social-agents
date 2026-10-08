import { describe, expect, it } from 'vitest';
import { openDatabase } from './db';
import { createExport, serializeExport } from './export';
import { applyImport, previewImport } from './import';
import type { Role } from './types';

const role = (id: string, updatedAt = 1): Role => ({
  id,
  label: 'Teammate',
  description: 'A project teammate.',
  builtIn: false,
  createdAt: 1,
  updatedAt,
});

describe('memory database and export', () => {
  it('stores, exports, previews, and imports records without settings', async () => {
    const source = await openDatabase(indexedDB, `source-${crypto.randomUUID()}`);
    await source.put('roles', role('role-1'));
    const json = serializeExport(await createExport(source, 1_700_000_000_000));
    expect(json).not.toContain('sa:settings');
    expect(json).not.toContain('apiKey');

    const target = await openDatabase(indexedDB, `target-${crypto.randomUUID()}`);
    const preview = await previewImport(json, target);
    expect(preview.additions).toBe(1);
    expect(preview.invalidReferences).toEqual([]);
    await applyImport(preview, 'merge', target);
    expect(await target.get('roles', 'role-1')).toEqual(role('role-1'));
    source.close();
    target.close();
  });

  it('keeps the newer record during merge', async () => {
    const source = await openDatabase(indexedDB, `newer-${crypto.randomUUID()}`);
    const target = await openDatabase(indexedDB, `older-${crypto.randomUUID()}`);
    await source.put('roles', role('role-1', 2));
    await target.put('roles', role('role-1', 1));
    const preview = await previewImport(serializeExport(await createExport(source)), target);
    await applyImport(preview, 'merge', target);
    expect((await target.get('roles', 'role-1'))?.updatedAt).toBe(2);
    source.close();
    target.close();
  });
});
