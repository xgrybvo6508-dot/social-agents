export type NoticeTone = 'info' | 'warn' | 'error' | 'agent';

export const createNotice = (message: string, tone: NoticeTone = 'info'): HTMLDivElement => {
  const notice = document.createElement('div');
  notice.className = `notice notice-${tone}`;
  notice.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  notice.textContent = message;
  return notice;
};
