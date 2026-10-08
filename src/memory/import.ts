import { hasOnlyKeys, isRecord } from '../lib/guards';
import type { SocialDatabase } from './db';
import { MEMORY_STORES, type MemoryData } from './types';
import { validateMemoryData } from './validation';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportPreview = {
  data: MemoryData;
  additions: number;
  updates: number;
  conflicts: number;
  invalidReferences: string[];
};

const findInvalidReferences = (data: MemoryData): string[] => {
  const people = new Set(data.people.map((record) => record.id));
  const roles = new Set(data.roles.map((record) => record.id));
  const invalid: string[] = [];
  data.groups.forEach((group) =>
    group.memberIds.forEach((id) => {
      if (!people.has(id)) invalid.push(`Group "${group.label}" refers to a missing person.`);
    }),
  );
  data.phrases.forEach((phrase) => {
    if (!roles.has(phrase.roleId)) invalid.push(`Phrase "${phrase.id}" refers to a missing role.`);
  });
  return invalid;
};

const parseEnvelope = (json: string): MemoryData => {
  if (new TextEncoder().encode(json).byteLength > MAX_IMPORT_BYTES) {
    throw new Error('The import file is larger than 5 MiB.');
  }
  let value: unknown;
  try {
    value = JSON.parse(json) as unknown;
  } catch {
    throw new Error('The import file is not valid JSON.');
  }
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['app', 'kind', 'exportVersion', 'schemaVersion', 'exportedAt', 'data']) ||
    value.app !== 'social-agents' ||
    value.kind !== 'memory-export' ||
    value.exportVersion !== 1 ||
    value.schemaVersion !== 1 ||
    typeof value.exportedAt !== 'string'
  ) {
    throw new Error('This is not a supported Social Agents memory export.');
  }
  const data = validateMemoryData(value.data);
  if (data === null) throw new Error('The import contains an invalid or unknown record.');
  return data;
};

export const previewImport = async (
  json: string,
  database: Pick<SocialDatabase, 'readAll'>,
): Promise<ImportPreview> => {
  const data = parseEnvelope(json);
  const current = await database.readAll();
  let additions = 0;
  let updates = 0;
  let conflicts = 0;
  for (const store of MEMORY_STORES) {
    const existing = new Map(current[store].map((record) => [record.id, record]));
    data[store].forEach((record) => {
      const match = existing.get(record.id);
      if (match === undefined) additions += 1;
      else if (record.updatedAt > match.updatedAt) updates += 1;
      else if (
        record.updatedAt === match.updatedAt &&
        JSON.stringify(record) !== JSON.stringify(match)
      ) {
        conflicts += 1;
      }
    });
  }
  return { data, additions, updates, conflicts, invalidReferences: findInvalidReferences(data) };
};

export const applyImport = async (
  preview: ImportPreview,
  mode: 'merge' | 'replace',
  database: Pick<SocialDatabase, 'mergeAll' | 'replaceAll'>,
): Promise<void> => {
  if (preview.invalidReferences.length > 0) {
    throw new Error('Fix invalid references before importing.');
  }
  if (mode === 'replace') await database.replaceAll(preview.data);
  else await database.mergeAll(preview.data);
};

export const emptyMemoryData = (): MemoryData => ({
  people: [],
  groups: [],
  roles: [],
  phrases: [],
  sessions: [],
  tasks: [],
  taFixations: [],
});
