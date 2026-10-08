import { createExport, serializeExport } from '../../memory/export';
import { applyImport, previewImport, type ImportPreview } from '../../memory/import';
import type { SocialDatabase } from '../../memory/db';
import { createButton } from '../components/button';
import { createNotice } from '../components/notice';
import { confirmDialog } from '../components/dialog';
import { announce, backLink, el } from '../dom';

export const renderMemory = (
  container: HTMLElement,
  database: SocialDatabase,
  liveRegion: HTMLElement,
): void => {
  container.append(backLink());
  container.append(
    el('p', {
      className: 'page-intro',
      text: 'People, phrases, tasks, and TA notes live here. Export does not include Settings or API keys.',
    }),
  );

  const status = el('div');
  container.append(status);

  const renderCounts = async (): Promise<void> => {
    const data = await database.readAll();
    const section = el('section', { className: 'memory-section' });
    const heading = el('h2', { text: 'Stored records' });
    const grid = el('div', { className: 'memory-counts' });
    const counts: [string, number][] = [
      ['People', data.people.length],
      ['Groups', data.groups.length],
      ['Roles', data.roles.length],
      ['Phrases', data.phrases.length],
      ['Sessions', data.sessions.length],
      ['Tasks', data.tasks.length],
      ['TA fixations', data.taFixations.length],
    ];
    counts.forEach(([label, count]) => {
      const stat = el('div', { className: 'memory-stat' });
      const strong = el('strong', { text: String(count) });
      const span = el('span', { text: label });
      stat.append(strong, span);
      grid.append(stat);
    });
    section.append(heading, grid);
    status.replaceChildren(section);
  };

  void renderCounts();

  const exportSection = el('section', { className: 'memory-section' });
  exportSection.append(el('h2', { text: 'Export' }));
  const exportBtn = createButton('Download memory JSON', {
    variant: 'secondary',
    onClick: () => {
      void createExport(database).then((envelope) => {
        const blob = new Blob([serializeExport(envelope)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = el('a', {
          attrs: { href: url, download: 'social-agents-memory.json' },
          text: 'download',
        });
        link.click();
        URL.revokeObjectURL(url);
        announce(liveRegion, 'Export downloaded.');
      });
    },
  });
  exportSection.append(exportBtn);
  container.append(exportSection);

  const importSection = el('section', { className: 'memory-section' });
  importSection.append(el('h2', { text: 'Import' }));
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
  fileInput.className = 'field-input';
  const previewBox = el('div');
  importSection.append(fileInput, previewBox);
  container.append(importSection);

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file === undefined) return;
    void file.text().then(async (text) => {
      try {
        const preview = await previewImport(text, database);
        previewBox.replaceChildren();
        const summary = createNotice(
          `Additions: ${String(preview.additions)}. Updates: ${String(preview.updates)}. Same-time conflicts: ${String(preview.conflicts)}.`,
        );
        previewBox.append(summary);
        if (preview.invalidReferences.length > 0) {
          previewBox.append(createNotice(preview.invalidReferences.join(' '), 'warn'));
        }
        const runImport = (mode: 'merge' | 'replace', preview: ImportPreview): void => {
          void applyImport(preview, mode, database).then(() => {
            announce(liveRegion, mode === 'merge' ? 'Import merged.' : 'Import replaced memory.');
            void renderCounts();
            previewBox.replaceChildren(
              createNotice(mode === 'merge' ? 'Import merged.' : 'Memory replaced from import.'),
            );
          });
        };
        if (preview.conflicts > 0) {
          previewBox.append(
            createNotice(
              'This file has same-time conflicts with local data. Merge keeps your local copy for those IDs. Use Replace only if you intend to overwrite.',
              'warn',
            ),
          );
        }
        const merge = createButton('Merge import', {
          variant: 'primary',
          onClick: () => runImport('merge', preview),
        });
        const replace = createButton('Replace all memory', {
          onClick: () => {
            const dialog = confirmDialog(
              'Replace all memory?',
              'This removes current people, phrases, tasks, and TA notes on this device, then imports the file.',
              () => runImport('replace', preview),
            );
            document.body.append(dialog);
            dialog.showModal();
          },
        });
        const actions = el('div', { className: 'page-actions' });
        actions.append(merge, replace);
        previewBox.append(actions);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Import could not be read.';
        previewBox.replaceChildren(createNotice(message, 'error'));
      }
    });
  });
};
