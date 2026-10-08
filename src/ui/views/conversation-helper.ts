import { AgentError } from '../../agent/errors';
import { runMode } from '../../agent/run-mode';
import { WORKSHEETS } from '../../content/worksheets';
import { createId } from '../../lib/ids';
import { createConversationHelperMode } from '../../modes/conversation-helper';
import type { Session } from '../../memory/types';
import { createButton } from '../components/button';
import { createTextArea, fieldGroup } from '../components/field';
import { createNotice } from '../components/notice';
import { announce, backLink, el } from '../dom';
import type { ModeViewDeps } from './mode-deps';
import { renderWorksheetStep, type WorksheetAnswers } from './worksheet';

const worksheet = WORKSHEETS.find((w) => w.mode === 'conversation-helper');
if (worksheet === undefined) throw new Error('Conversation worksheet is missing.');

type Phase = 'input' | 'manual' | 'agent' | 'summary';

export const renderConversationHelper = (container: HTMLElement, deps: ModeViewDeps): void => {
  container.append(backLink());
  let phase: Phase = 'input';
  let excerpt = '';
  let manualStep = 0;
  let manualAnswers: WorksheetAnswers = {};
  let summary = '';

  const body = el('div');
  container.append(body);

  const paint = (): void => {
    body.replaceChildren();

    if (phase === 'input') {
      body.append(
        createNotice(
          'Paste only what you need. Remove names and private details if you can.',
          'info',
        ),
      );
      const area = createTextArea('conversation-excerpt', { value: excerpt, rows: 6 });
      area.addEventListener('input', () => {
        excerpt = area.value;
      });
      body.append(fieldGroup('Conversation excerpt', area));
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
          disabled: excerpt.trim().length === 0,
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
          summary = Object.values(manualAnswers).join('\n');
          phase = 'summary';
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
      body.append(createNotice('Analyzing excerpt…', 'agent'));
      const mode = createConversationHelperMode({ excerpt });
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
            createButton('Open manual worksheet', {
              variant: 'primary',
              onClick: () => {
                phase = 'manual';
                paint();
              },
            }),
          );
          return;
        }
        const panel = el('div', { className: 'agent-panel' });
        panel.append(el('h3', { text: 'Agent reading' }));
        result.value.observations.forEach((item) => {
          panel.append(el('p', { text: `${item.observation} (${item.evidence})` }));
        });
        panel.append(el('p', { text: `Direct reply: ${result.value.replies.direct}` }));
        body.replaceChildren(panel);
        summary = result.value.replies.direct;
        body.append(
          createButton('Save summary', {
            variant: 'primary',
            onClick: () => {
              phase = 'summary';
              paint();
            },
          }),
        );
      });
      return;
    }

    const area = createTextArea('conversation-summary', { value: summary, rows: 6 });
    area.addEventListener('input', () => {
      summary = area.value;
    });
    body.append(fieldGroup('Summary to save', area));
    body.append(
      createButton('Save session summary', {
        variant: 'primary',
        disabled: summary.trim().length === 0,
        onClick: () => {
          const now = Date.now();
          const session: Session = {
            id: createId(),
            mode: 'conversation-helper',
            relatedIds: [],
            summary: summary.trim(),
            reviewEvents: [],
            startedAt: now,
            endedAt: now,
            createdAt: now,
            updatedAt: now,
          };
          void deps.database.put('sessions', session).then(() => {
            announce(deps.liveRegion, 'Summary saved.');
            phase = 'input';
            excerpt = '';
            summary = '';
            paint();
          });
        },
      }),
    );
  };

  paint();
};
