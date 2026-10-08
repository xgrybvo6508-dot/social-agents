import type { SocialDatabase } from './db';
import { STARTER_ROLE_IDS } from '../content/starter-phrases';
import type { Role } from './types';

const BUILT_IN_ROLES: readonly { id: string; label: string; description: string }[] = [
  {
    id: 'role-teammate',
    label: 'Teammate',
    description: 'A peer on the same project or team.',
  },
  {
    id: 'role-team-lead',
    label: 'Team lead',
    description: 'Someone who coordinates work and expectations.',
  },
  {
    id: 'role-new-acquaintance',
    label: 'New acquaintance',
    description: 'Someone you met recently and may collaborate with.',
  },
  {
    id: 'role-meetup-attendee',
    label: 'Meetup attendee',
    description: 'Someone at an event or community meetup.',
  },
  {
    id: 'role-coding-contest-participant',
    label: 'Coding contest participant',
    description: 'Someone at a hackathon or programming contest.',
  },
];

const META_SEEDED_KEY = 'seededContentVersion';
const SEEDED_VERSION = 1;

export const seedBuiltInRoles = async (
  database: SocialDatabase,
  now = Date.now(),
): Promise<void> => {
  const metaStore = database.raw.transaction('meta', 'readonly').objectStore('meta');
  const existing = await new Promise<{ key: string; value: number } | undefined>(
    (resolve, reject) => {
      const request = metaStore.get(META_SEEDED_KEY);
      request.addEventListener('success', () => {
        resolve(request.result as { key: string; value: number } | undefined);
      });
      request.addEventListener('error', () => reject(new Error('Could not read seed metadata.')));
    },
  );
  if (existing?.value === SEEDED_VERSION) return;

  const currentRoles = await database.getAll('roles');
  const byId = new Map(currentRoles.map((role) => [role.id, role]));

  for (const builtIn of BUILT_IN_ROLES) {
    if (!STARTER_ROLE_IDS.includes(builtIn.id as (typeof STARTER_ROLE_IDS)[number])) continue;
    if (byId.has(builtIn.id)) continue;
    const record: Role = {
      id: builtIn.id,
      label: builtIn.label,
      description: builtIn.description,
      builtIn: true,
      createdAt: now,
      updatedAt: now,
    };
    await database.put('roles', record);
  }

  const transaction = database.raw.transaction('meta', 'readwrite');
  transaction.objectStore('meta').put({ key: META_SEEDED_KEY, value: SEEDED_VERSION });
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve());
    transaction.addEventListener('error', () => reject(new Error('Could not save seed metadata.')));
  });
};
