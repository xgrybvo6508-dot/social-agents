import { describe, expect, it } from 'vitest';
import { openDatabase } from './db';
import { createExport, serializeExport } from './export';
import { MAX_IMPORT_BYTES, applyImport, emptyMemoryData, previewImport } from './import';
import type { Group, Person, Phrase, Role } from './types';

const role = (id: string, updatedAt = 1): Role => ({
  id,
  label: 'Teammate',
  description: 'A project teammate.',
  builtIn: false,
  createdAt: 1,
  updatedAt,
});

const person = (id: string): Person => ({
  id,
  label: 'Alex',
  context: '',
  notes: '',
  createdAt: 1,
  updatedAt: 1,
});

const group = (id: string, memberIds: string[]): Group => ({
  id,
  label: 'Team',
  purpose: '',
  memberIds,
  notes: '',
  createdAt: 1,
  updatedAt: 1,
});

const phrase = (id: string, roleId: string): Phrase => ({
  id,
  roleId,
  situation: 'chat',
  category: 'opener',
  text: 'Hi.',
  note: '',
  source: 'manual',
  archived: false,
  srs: {
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    dueAt: 1,
    lastReviewedAt: null,
    lastGrade: null,
  },
  createdAt: 1,
  updatedAt: 1,
});

const minimalExportJson = (data: ReturnType<typeof emptyMemoryData>): string =>
  JSON.stringify({
    app: 'social-agents',
    kind: 'memory-export',
    exportVersion: 1,
    schemaVersion: 1,
    exportedAt: '2026-01-01T00:00:00.000Z',
    data,
  });

describe('memory import', () => {
  it('rejects non-JSON, wrong envelope, and oversized files', async () => {
    const db = await openDatabase(indexedDB, `import-parse-${crypto.randomUUID()}`);
    await expect(previewImport('{', db)).rejects.toThrow(/not valid JSON/i);
    await expect(
      previewImport(JSON.stringify({ app: 'other', kind: 'memory-export', exportVersion: 1 }), db),
    ).rejects.toThrow(/not a supported Social Agents memory export/i);
    const huge = 'x'.repeat(MAX_IMPORT_BYTES + 1);
    await expect(previewImport(huge, db)).rejects.toThrow(/larger than 5 MiB/i);
    db.close();
  });

  it('rejects import data that fails record validation', async () => {
    const db = await openDatabase(indexedDB, `import-invalid-${crypto.randomUUID()}`);
    const data = emptyMemoryData();
    data.roles.push({ ...role('r1'), label: 'y'.repeat(200) });
    await expect(previewImport(minimalExportJson(data), db)).rejects.toThrow(
      /invalid or unknown record/i,
    );
    db.close();
  });

  it('reports invalid cross-store references in preview', async () => {
    const db = await openDatabase(indexedDB, `import-refs-${crypto.randomUUID()}`);
    const data = emptyMemoryData();
    data.groups.push(group('g1', ['missing-person']));
    data.phrases.push(phrase('p1', 'missing-role'));
    const preview = await previewImport(minimalExportJson(data), db);
    expect(preview.invalidReferences).toHaveLength(2);
    await expect(applyImport(preview, 'merge', db)).rejects.toThrow(/Fix invalid references/i);
    db.close();
  });

  it('counts conflicts when updatedAt matches but records differ', async () => {
    const target = await openDatabase(indexedDB, `import-conflict-${crypto.randomUUID()}`);
    await target.put('roles', role('role-1', 5));
    const data = emptyMemoryData();
    data.roles.push({ ...role('role-1', 5), label: 'Different label' });
    const preview = await previewImport(minimalExportJson(data), target);
    expect(preview.conflicts).toBe(1);
    expect(preview.updates).toBe(0);
    target.close();
  });

  it('replace mode overwrites local memory', async () => {
    const source = await openDatabase(indexedDB, `import-src-${crypto.randomUUID()}`);
    const target = await openDatabase(indexedDB, `import-tgt-${crypto.randomUUID()}`);
    await source.put('roles', role('only-in-export'));
    await target.put('roles', role('only-local'));
    await target.put('people', person('keep-should-go'));
    const json = serializeExport(await createExport(source));
    const preview = await previewImport(json, target);
    await applyImport(preview, 'replace', target);
    expect(await target.get('roles', 'only-in-export')).toBeDefined();
    expect(await target.get('roles', 'only-local')).toBeUndefined();
    expect(await target.getAll('people')).toHaveLength(0);
    source.close();
    target.close();
  });

  it('merge keeps the newer updatedAt when ids collide', async () => {
    const source = await openDatabase(indexedDB, `merge-new-${crypto.randomUUID()}`);
    const target = await openDatabase(indexedDB, `merge-old-${crypto.randomUUID()}`);
    await source.put('roles', { ...role('role-1', 10), label: 'From import' });
    await target.put('roles', { ...role('role-1', 3), label: 'Local' });
    const preview = await previewImport(serializeExport(await createExport(source)), target);
    expect(preview.updates).toBe(1);
    await applyImport(preview, 'merge', target);
    expect((await target.get('roles', 'role-1'))?.label).toBe('From import');
    source.close();
    target.close();
  });
});
