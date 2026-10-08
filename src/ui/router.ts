export type Route =
  | 'home'
  | 'phrase-prep'
  | 'phrase-training'
  | 'conversation-helper'
  | 'task-extraction'
  | 'ta'
  | 'memory'
  | 'settings'
  | 'not-found';

const routes: Record<string, Route> = {
  '#/': 'home',
  '#/phrase-prep': 'phrase-prep',
  '#/phrase-training': 'phrase-training',
  '#/conversation-helper': 'conversation-helper',
  '#/task-extraction': 'task-extraction',
  '#/ta': 'ta',
  '#/memory': 'memory',
  '#/settings': 'settings',
};

export const parseRoute = (hash: string): Route => routes[hash] ?? 'not-found';

export type Router = {
  start(render: (route: Route) => void): () => void;
};

export const createRouter = (target: Window = window): Router => ({
  start(render) {
    const routeChanged = (): void => {
      render(parseRoute(target.location.hash || '#/'));
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('main h1')?.focus();
      });
    };
    target.addEventListener('hashchange', routeChanged);
    routeChanged();
    return () => target.removeEventListener('hashchange', routeChanged);
  },
});
