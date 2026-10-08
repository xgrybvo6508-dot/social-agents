export const clear = (parent: HTMLElement): void => {
  parent.replaceChildren();
};

export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    className?: string;
    id?: string;
    text?: string;
    attrs?: Record<string, string>;
  },
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (options?.className) node.className = options.className;
  if (options?.id) node.id = options.id;
  if (options?.text !== undefined) node.textContent = options.text;
  if (options?.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => node.setAttribute(key, value));
  }
  return node;
};

export const appendLiveRegion = (parent: HTMLElement): HTMLElement => {
  const region = el('div', {
    className: 'live-region',
    attrs: { 'aria-live': 'polite', 'aria-atomic': 'true' },
  });
  parent.append(region);
  return region;
};

export const announce = (region: HTMLElement, message: string): void => {
  region.textContent = message;
};

export const pageShell = (title: string): { main: HTMLElement; heading: HTMLElement } => {
  const main = el('main', { id: 'main-content' });
  const heading = el('h1');
  heading.tabIndex = -1;
  heading.textContent = title;
  main.append(heading);
  return { main, heading };
};

export const backLink = (label = 'Back to home'): HTMLAnchorElement => {
  const link = el('a', { className: 'text-link quiet-link', text: label });
  link.href = '#/';
  return link;
};
