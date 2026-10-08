import { el } from '../dom';

const modes: { hash: string; title: string; description: string }[] = [
  {
    hash: '#/phrase-prep',
    title: 'Prepare phrases',
    description: 'Draft openers and follow-ups for a role and situation.',
  },
  {
    hash: '#/phrase-training',
    title: 'Train phrases',
    description: 'Recall saved phrases with spaced repetition.',
  },
  {
    hash: '#/conversation-helper',
    title: 'Understand a conversation',
    description: 'Separate facts from guesses and draft replies.',
  },
  {
    hash: '#/task-extraction',
    title: 'Generate me a task',
    description: 'Turn a request into concrete checklist items.',
  },
  {
    hash: '#/ta',
    title: 'Transactional Analysis',
    description: 'Use TA as a tentative lens, then choose your decision.',
  },
];

export const renderHome = (container: HTMLElement): void => {
  const intro = el('p', {
    className: 'page-intro',
    text: 'Practice communication and plan project invitations. Everything stays on this device.',
  });
  container.append(intro);

  const grid = el('div', { className: 'home-grid' });
  modes.forEach((mode) => {
    const link = el('a', { className: 'home-tile', attrs: { href: mode.hash } });
    const title = el('span', { className: 'home-tile-title', text: mode.title });
    const desc = el('span', { className: 'home-tile-desc', text: mode.description });
    link.append(title, desc);
    grid.append(link);
  });
  container.append(grid);

  const footer = el('nav', { className: 'nav-footer', attrs: { 'aria-label': 'Secondary' } });
  const memory = el('a', { text: 'Memory', attrs: { href: '#/memory' } });
  const settings = el('a', { text: 'Settings', attrs: { href: '#/settings' } });
  footer.append(memory, settings);
  container.append(footer);
};
