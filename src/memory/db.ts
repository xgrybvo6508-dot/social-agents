import {
  MEMORY_STORES,
  type MemoryData,
  type MemoryRecordMap,
  type MemoryStoreName,
} from './types';

export const DB_NAME = 'social-agents';
export const DB_VERSION = 1;

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(new Error('Local memory request failed.')));
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve());
    transaction.addEventListener('abort', () =>
      reject(new Error('Local memory write was stopped.')),
    );
    transaction.addEventListener('error', () => reject(new Error('Local memory write failed.')));
  });

const createStore = (
  database: IDBDatabase,
  name: MemoryStoreName,
  indexes: readonly [string, string][],
): void => {
  const store = database.createObjectStore(name, { keyPath: 'id' });
  indexes.forEach(([indexName, keyPath]) => store.createIndex(indexName, keyPath));
};

const upgradeToV1 = (database: IDBDatabase): void => {
  createStore(database, 'people', [
    ['label', 'label'],
    ['updatedAt', 'updatedAt'],
  ]);
  createStore(database, 'groups', [['updatedAt', 'updatedAt']]);
  createStore(database, 'roles', [
    ['label', 'label'],
    ['builtIn', 'builtIn'],
  ]);
  createStore(database, 'phrases', [
    ['roleId', 'roleId'],
    ['category', 'category'],
    ['archived', 'archived'],
    ['dueAt', 'srs.dueAt'],
  ]);
  createStore(database, 'sessions', [
    ['mode', 'mode'],
    ['startedAt', 'startedAt'],
  ]);
  createStore(database, 'tasks', [
    ['status', 'status'],
    ['createdAt', 'createdAt'],
  ]);
  createStore(database, 'taFixations', [
    ['scope', 'scope'],
    ['createdAt', 'createdAt'],
  ]);
  database.createObjectStore('meta', { keyPath: 'key' });
};

export type SocialDatabase = {
  raw: IDBDatabase;
  getAll<K extends MemoryStoreName>(store: K): Promise<MemoryRecordMap[K][]>;
  get<K extends MemoryStoreName>(store: K, id: string): Promise<MemoryRecordMap[K] | undefined>;
  put<K extends MemoryStoreName>(store: K, record: MemoryRecordMap[K]): Promise<void>;
  delete(store: MemoryStoreName, id: string): Promise<void>;
  readAll(): Promise<MemoryData>;
  replaceAll(data: MemoryData): Promise<void>;
  mergeAll(data: MemoryData): Promise<void>;
  close(): void;
};

export const openDatabase = (
  factory: IDBFactory = indexedDB,
  name = DB_NAME,
): Promise<SocialDatabase> =>
  new Promise((resolve, reject) => {
    const request = factory.open(name, DB_VERSION);
    request.addEventListener('upgradeneeded', (event) => {
      if (event.oldVersion === 0) upgradeToV1(request.result);
    });
    request.addEventListener('error', () => reject(new Error('Local memory could not open.')));
    request.addEventListener('blocked', () =>
      reject(new Error('Close another app tab, then try again.')),
    );
    request.addEventListener('success', () => {
      const raw = request.result;
      const api: SocialDatabase = {
        raw,
        async getAll<K extends MemoryStoreName>(store: K): Promise<MemoryRecordMap[K][]> {
          const transaction = raw.transaction(store, 'readonly');
          const values = await requestResult(transaction.objectStore(store).getAll());
          return values as MemoryRecordMap[K][];
        },
        async get<K extends MemoryStoreName>(
          store: K,
          id: string,
        ): Promise<MemoryRecordMap[K] | undefined> {
          const transaction = raw.transaction(store, 'readonly');
          const value: unknown = await requestResult(transaction.objectStore(store).get(id));
          return value as MemoryRecordMap[K] | undefined;
        },
        async put<K extends MemoryStoreName>(store: K, record: MemoryRecordMap[K]): Promise<void> {
          const transaction = raw.transaction(store, 'readwrite');
          transaction.objectStore(store).put(record);
          await transactionDone(transaction);
        },
        async delete(store: MemoryStoreName, id: string): Promise<void> {
          const transaction = raw.transaction(store, 'readwrite');
          transaction.objectStore(store).delete(id);
          await transactionDone(transaction);
        },
        async readAll(): Promise<MemoryData> {
          const entries = await Promise.all(MEMORY_STORES.map((store) => api.getAll(store)));
          return {
            people: entries[0] as MemoryData['people'],
            groups: entries[1] as MemoryData['groups'],
            roles: entries[2] as MemoryData['roles'],
            phrases: entries[3] as MemoryData['phrases'],
            sessions: entries[4] as MemoryData['sessions'],
            tasks: entries[5] as MemoryData['tasks'],
            taFixations: entries[6] as MemoryData['taFixations'],
          };
        },
        async replaceAll(data: MemoryData): Promise<void> {
          const transaction = raw.transaction([...MEMORY_STORES], 'readwrite');
          for (const storeName of MEMORY_STORES) {
            const store = transaction.objectStore(storeName);
            store.clear();
            for (const record of data[storeName]) store.put(record);
          }
          await transactionDone(transaction);
        },
        async mergeAll(data: MemoryData): Promise<void> {
          const current = await api.readAll();
          const merged = {} as MemoryData;
          for (const storeName of MEMORY_STORES) {
            const records = new Map<string, MemoryData[typeof storeName][number]>();
            for (const record of current[storeName]) records.set(record.id, record);
            for (const incoming of data[storeName]) {
              const existing = records.get(incoming.id);
              if (existing === undefined || incoming.updatedAt > existing.updatedAt) {
                records.set(incoming.id, incoming);
              }
            }
            Object.assign(merged, { [storeName]: [...records.values()] });
          }
          await api.replaceAll(merged);
        },
        close(): void {
          raw.close();
        },
      };
      resolve(api);
    });
  });
