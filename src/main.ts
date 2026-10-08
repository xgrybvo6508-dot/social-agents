import { createAgentClient } from './agent/client';
import { loadSettings } from './agent/settings';
import { openDatabase } from './memory/db';
import { seedBuiltInRoles } from './memory/seed';
import { createApp } from './ui/app';
import { registerPwa } from './ui/pwa';
import { createRouter } from './ui/router';
import './ui/tokens.css';
import './ui/base.css';
import './ui/layout.css';
import './ui/components.css';

const bootstrap = async (): Promise<void> => {
  const root = document.querySelector<HTMLElement>('#app');
  if (root === null) throw new Error('App root is missing.');
  const database = await openDatabase();
  await seedBuiltInRoles(database);
  const app = createApp(root, {
    database,
    agent: createAgentClient(),
    getSettings: () => loadSettings(localStorage),
    storage: localStorage,
  });
  createRouter().start((route) => app.render(route));
  registerPwa();
};

void bootstrap();
