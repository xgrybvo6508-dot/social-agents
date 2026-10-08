import { AgentError } from '../../agent/errors';
import { runMode } from '../../agent/run-mode';
import { WORKSHEETS } from '../../content/worksheets';
import { createId } from '../../lib/ids';
import { createTaskExtractionMode } from '../../modes/task-extraction';
import type { SavedTask, TaskItem } from '../../memory/types';
import { createButton } from '../components/button';
import { createTextArea, fieldGroup } from '../components/field';
import { createNotice } from '../components/notice';
import { announce, backLink, el } from '../dom';
import type { ModeViewDeps } from './mode-deps';
import { renderWorksheetStep, type WorksheetAnswers } from './worksheet';

const worksheet = WORKSHEETS.find((w) => w.mode === 'task-extraction');
if (worksheet === undefined) throw new Error('Task worksheet is missing.');

type Phase = 'input' | 'manual' | 'agent' | 'review';

export const renderTaskExtraction = (container: HTMLElement, deps: ModeViewDeps): void => {
  container.append(backLink());
  let phase: Phase = 'input';
  let sourceText = '';
  let manualStep = 0;
  let manualAnswers: WorksheetAnswers = {};
  let title = '';
  let items: TaskItem[] = [];
  let unknowns: string[] = [];
  let sourceExcerpt = '';

  const body = el('div');
  container.append(body);

  const paint = (): void => {
    body.replaceChildren();

    if (phase === 'input') {
      body.append(
        createNotice(
          'Paste only what you need. Remove names and private details before using the agent.',
          'info',
        ),
      );
      const area = createTextArea('task-source', { value: sourceText, rows: 6 });
      area.addEventListener('input', () => {
        sourceText = area.value;
      });
      body.append(fieldGroup('Request or notes', area));
      const actions = el('div', { className: 'page-actions' });
      actions.append(
        createButton('Manual worksheet', {
          onClick: () => {
            phase = 'manual';
            manualStep = 0;
            paint();
          },
        }),
        createButton('Ask agent', {
          variant: 'primary',
          disabled: sourceText.trim().length === 0,
          onClick: () => {
            phase = 'agent';
            paint();
          },
        }),
      );
      body.append(actions);
      return;
    }

    if (phase === 'manual') {
      renderWorksheetStep(body, {
        worksheet,
        answers: manualAnswers,
        stepIndex: manualStep,
        onAnswersChange: (a) => {
          manualAnswers = a;
        },
        onStepChange: (i) => {
          manualStep = i;
          paint();
        },
        onComplete: () => {
          title = manualAnswers['task-extraction-outcome-0'] ?? 'Task from worksheet';
          sourceExcerpt = sourceText;
          phase = 'review';
          paint();
        },
      });
      return;
    }

    if (phase === 'agent') {
      const settings = deps.getSettings();
      if (settings.apiKey.length === 0) {
        body.append(createNotice('Add an API key in Settings to use the agent.', 'warn'));
        return;
      }
      body.append(createNotice('Extracting tasks…', 'agent'));
      const mode = createTaskExtractionMode({ sourceText });
      if (!mode.ok) {
        body.replaceChildren(createNotice(mode.error.message, 'error'));
        return;
      }
      void runMode(deps.agent, settings, mode.value).then((result) => {
        if (result.status === 'manual-fallback') {
          body.replaceChildren(
            createNotice(
              result.error instanceof AgentError
                ? result.error.message
                : 'Use the manual worksheet.',
              'error',
            ),
          );
          return;
        }
        title = result.value.title;
        items = result.value.items;
        unknowns = result.value.unknowns;
        sourceExcerpt = sourceText;
        phase = 'review';
        paint();
      });
      return;
    }

    const panel = el('div', { className: 'agent-panel' });
    panel.append(el('h3', { text: 'Task review' }));
    panel.append(el('h2', { text: title }));
    if (items.length > 0) {
      const list = el('ul', { className: 'result-list' });
      items.forEach((item) => {
        list.append(el('li', { text: `${item.action} (${item.confidence})` }));
      });
      panel.append(list);
    }
    if (unknowns.length > 0) {
      panel.append(el('p', { text: `Unknowns: ${unknowns.join('; ')}` }));
    }
    body.append(panel);
    body.append(
      createButton('Save task', {
        variant: 'primary',
        onClick: () => {
          const now = Date.now();
          const task: SavedTask = {
            id: createId(),
            title,
            sourceExcerpt,
            items,
            unknowns,
            status: 'open',
            createdAt: now,
            updatedAt: now,
          };
          void deps.database.put('tasks', task).then(() => {
            announce(deps.liveRegion, 'Task saved.');
            phase = 'input';
            sourceText = '';
            items = [];
            unknowns = [];
            paint();
          });
        },
      }),
    );
  };

  paint();
};
