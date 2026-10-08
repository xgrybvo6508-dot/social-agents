import type { SocialDatabase } from './db';
import type { MemoryData } from './types';
import { validateMemoryData } from './validation';

export type ExportEnvelope = {
  app: 'social-agents';
  kind: 'memory-export';
  exportVersion: 1;
  schemaVersion: 1;
  exportedAt: string;
  data: MemoryData;
};

export const createExport = async (
  database: Pick<SocialDatabase, 'readAll'>,
  now = Date.now(),
): Promise<ExportEnvelope> => {
  const data = validateMemoryData(await database.readAll());
  if (data === null) throw new Error('Memory contains an invalid record and was not exported.');
  return {
    app: 'social-agents',
    kind: 'memory-export',
    exportVersion: 1,
    schemaVersion: 1,
    exportedAt: new Date(now).toISOString(),
    data,
  };
};

export const serializeExport = (envelope: ExportEnvelope): string =>
  JSON.stringify(envelope, null, 2);
