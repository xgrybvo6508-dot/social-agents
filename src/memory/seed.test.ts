import { describe, expect, it } from 'vitest';
import { STARTER_ROLE_IDS } from '../content/starter-phrases';
import { openDatabase } from './db';
import { seedBuiltInRoles } from './seed';
import type { Role } from './types';

describe('seed built-in roles', () => {
  it('inserts starter roles once and marks metadata', async () => {
    const now = 1_700_000_000_000;
    const db = await openDatabase(indexedDB, `seed-${crypto.randomUUID()}`);
    await seedBuiltInRoles(db, now);
    const roles = await db.getAll('roles');
    expect(roles).toHaveLength(STARTER_ROLE_IDS.length);
    for (const roleId of STARTER_ROLE_IDS) {
      const record = roles.find((r) => r.id === roleId);
      expect(record?.builtIn).toBe(true);
      expect(record?.createdAt).toBe(now);
    }
    const meta = await new Promise<{ key: string; value: number } | undefined>(
      (resolve, reject) => {
        const request = db.raw
          .transaction('meta', 'readonly')
          .objectStore('meta')
          .get('seededContentVersion');
        request.addEventListener('success', () =>
          resolve(request.result as { key: string; value: number }),
        );
        request.addEventListener('error', () => reject(new Error('meta read failed')));
      },
    );
    expect(meta?.value).toBe(1);

    await seedBuiltInRoles(db, now + 1);
    expect(await db.getAll('roles')).toHaveLength(STARTER_ROLE_IDS.length);
    db.close();
  });

  it('does not overwrite an existing role with the same id', async () => {
    const db = await openDatabase(indexedDB, `seed-skip-${crypto.randomUUID()}`);
    const custom: Role = {
      id: STARTER_ROLE_IDS[0],
      label: 'Custom label',
      description: 'User-defined.',
      builtIn: false,
      createdAt: 1,
      updatedAt: 1,
    };
    await db.put('roles', custom);
    await seedBuiltInRoles(db, 2);
    const kept = await db.get('roles', STARTER_ROLE_IDS[0]);
    expect(kept?.label).toBe('Custom label');
    expect(kept?.builtIn).toBe(false);
    db.close();
  });
});
