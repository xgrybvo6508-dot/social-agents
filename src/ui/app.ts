import type { AgentClient } from '../agent/client';
import type { Settings } from '../agent/settings';
import type { SocialDatabase } from '../memory/db';
import { appendLiveRegion, clear, pageShell } from './dom';
import type { Route } from './router';
import { renderHome } from './views/home';
import { renderMemory } from './views/memory';
import { renderPhrasePrep } from './views/phrase-prep';
import { renderPhraseTraining } from './views/phrase-training';
import { renderConversationHelper } from './views/conversation-helper';
import { renderTaskExtraction } from './views/task-extraction';
import { renderTa } from './views/ta';
import { renderSettings } from './views/settings';
import { createButton } from './components/button';

export type AppDependencies = {
  database: SocialDatabase;
  agent: AgentClient;
  getSettings: () => Settings;
  storage: Storage;
};

const routeTitle: Record<Route, string> = {
  home: 'Social Agents',
  'phrase-prep': 'Prepare phrases',
  'phrase-training': 'Train phrases',
  'conversation-helper': 'Understand a conversation',
  'task-extraction': 'Generate me a task',
  ta: 'Transactional Analysis',
  memory: 'Memory',
  settings: 'Settings',
  'not-found': 'Page not found',
};

export const createApp = (root: HTMLElement, dependencies: AppDependencies) => {
  const liveRegion = appendLiveRegion(root);

  const modeDeps = {
    database: dependencies.database,
    agent: dependencies.agent,
    getSettings: dependencies.getSettings,
    liveRegion,
  };

  return {
    render(route: Route): void {
      clear(root);
      const { main, heading } = pageShell(routeTitle[route]);
      root.append(main);
      root.append(liveRegion);

      if (route === 'not-found') {
        const link = createButton('Go home', {
          variant: 'primary',
          onClick: () => {
            window.location.hash = '#/';
          },
        });
        main.append(link);
        return;
      }

      const content = document.createElement('div');
      main.append(content);

      switch (route) {
        case 'home':
          renderHome(content);
          break;
        case 'phrase-prep':
          renderPhrasePrep(content, modeDeps);
          break;
        case 'phrase-training':
          renderPhraseTraining(content, modeDeps);
          break;
        case 'conversation-helper':
          renderConversationHelper(content, modeDeps);
          break;
        case 'task-extraction':
          renderTaskExtraction(content, modeDeps);
          break;
        case 'ta':
          renderTa(content, modeDeps);
          break;
        case 'memory':
          renderMemory(content, dependencies.database, liveRegion);
          break;
        case 'settings':
          renderSettings(content, {
            agent: dependencies.agent,
            getSettings: dependencies.getSettings,
            storage: dependencies.storage,
            liveRegion,
          });
          break;
        default:
          break;
      }

      heading.focus();
    },
  };
};
