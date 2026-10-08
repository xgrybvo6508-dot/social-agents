import { createButton } from './components/button';
import { el } from './dom';

export const registerPwa = (): void => {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        const banner = el('div', { className: 'pwa-banner' });
        banner.append(el('p', { text: 'A new version is ready.' }));
        banner.append(
          createButton('Update', {
            variant: 'primary',
            onClick: () => {
              void updateSW(true);
              banner.remove();
            },
          }),
        );
        banner.append(
          createButton('Later', {
            onClick: () => banner.remove(),
          }),
        );
        document.body.append(banner);
      },
    });
  });
};
