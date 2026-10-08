import { AgentError } from '../../agent/errors';
import { runMode } from '../../agent/run-mode';
import { STARTER_PHRASES } from '../../content/starter-phrases';
import { WORKSHEETS } from '../../content/worksheets';
import { createId } from '../../lib/ids';
import { createPhrasePreparationMode } from '../../modes/phrase-prep';
import { newSrsState } from '../../memory/phrase-srs';
import type { Phrase } from '../../memory/types';
import { createButton } from '../components/button';
import { createSelect, createTextArea, createTextInput, fieldGroup } from '../components/field';
import { createNotice } from '../components/notice';
import { announce, backLink, el } from '../dom';
import type { ModeViewDeps } from './mode-deps';
import { renderWorksheetStep, type WorksheetAnswers } from './worksheet';

const worksheet = WORKSHEETS.find((w) => w.mode === 'phrase-preparation');
if (worksheet === undefined) throw new Error('Phrase preparation worksheet is missing.');

type Phase = 'setup' | 'path' | 'starter' | 'manual' | 'agent' | 'save';

const saveStarterPhrases = async (
  database: ModeViewDeps['database'],
  roleId: string,
  ids: Set<string>,
): Promise<number> => {
  const now = Date.now();
  let saved = 0;
  for (const starter of STARTER_PHRASES) {
    if (!ids.has(starter.id)) continue;
    const phrase: Phrase = {
      id: createId(),
      roleId,
      situation: starter.situation,
      category: starter.category,
      text: starter.text,
      note: starter.note,
      source: 'starter',
      archived: false,
      srs: newSrsState(now),
      createdAt: now,
      updatedAt: now,
    };
    await database.put('phrases', phrase);
    saved += 1;
  }
  return saved;
};

export const renderPhrasePrep = (container: HTMLElement, deps: ModeViewDeps): void => {
  container.append(backLink());
  let phase: Phase = 'setup';
  let roleId = '';
  let situation = '';
  let goal = '';
  let manualStep = 0;
  let manualAnswers: WorksheetAnswers = {};
  const selectedPhraseIds = new Set<string>();
  let agentDraft = '';
  let agentRunning = false;

  const body = el('div');
  container.append(body);

  const paint = (): void => {
    body.replaceChildren();

    if (phase === 'setup') {
      void deps.database.getAll('roles').then((roles) => {
        if (phase !== 'setup') return;
        body.replaceChildren();
        body.append(
          el('p', {
            className: 'page-intro',
            text: 'Choose a role and describe the situation. You can use starter phrases, a worksheet, or the agent.',
          }),
        );
        body.append(
          createNotice(
            'Use role labels only. Remove names and private details before using the agent.',
            'info',
          ),
        );
        const select = createSelect(
          'prep-role',
          roles.map((r) => ({ value: r.id, label: r.label })),
          roleId.length > 0 ? roleId : roles[0]?.id,
        );
        roleId = select.value;
        select.addEventListener('change', () => {
          roleId = select.value;
        });
        const sit = createTextArea('prep-situation', { value: situation });
        sit.addEventListener('input', () => {
          situation = sit.value;
        });
        const g = createTextInput('prep-goal', { value: goal });
        g.addEventListener('input', () => {
          goal = g.value;
        });
        body.append(
          fieldGroup('Role', select),
          fieldGroup('Situation', sit),
          fieldGroup('Goal', g),
        );
        const actions = el('div', { className: 'page-actions' });
        actions.append(
          createButton('Continue', {
            variant: 'primary',
            disabled: roleId.length === 0,
            onClick: () => {
              phase = 'path';
              paint();
            },
          }),
        );
        body.append(actions);
      });
      return;
    }

    if (phase === 'path') {
      body.append(el('p', { className: 'page-intro', text: 'Choose one path.' }));
      const actions = el('div', { className: 'page-actions' });
      actions.append(
        createButton('Browse starter phrases', {
          variant: 'primary',
          onClick: () => {
            phase = 'starter';
            paint();
          },
        }),
        createButton('Manual worksheet', {
          onClick: () => {
            phase = 'manual';
            manualStep = 0;
            paint();
          },
        }),
        createButton('Ask agent', {
          onClick: () => {
            phase = 'agent';
            agentRunning = true;
            paint();
          },
        }),
      );
      body.append(actions);
      return;
    }

    if (phase === 'starter') {
      const matches = STARTER_PHRASES.filter((p) => p.roleId === roleId);
      body.append(el('p', { className: 'page-intro', text: 'Select phrases to save.' }));
      const list = el('ul', { className: 'card-list' });
      matches.forEach((phrase) => {
        const li = el('li');
        const btn = createButton(phrase.text, {
          onClick: () => {
            if (selectedPhraseIds.has(phrase.id)) selectedPhraseIds.delete(phrase.id);
            else selectedPhraseIds.add(phrase.id);
            paint();
          },
        });
        if (selectedPhraseIds.has(phrase.id)) btn.classList.add('is-selected');
        li.append(btn);
        list.append(li);
      });
      body.append(list);
      body.append(
        createButton('Save selected', {
          variant: 'primary',
          disabled: selectedPhraseIds.size === 0,
          onClick: () => {
            void saveStarterPhrases(deps.database, roleId, selectedPhraseIds).then((count) => {
              announce(deps.liveRegion, `Saved ${String(count)} phrases.`);
              phase = 'setup';
              selectedPhraseIds.clear();
              paint();
            });
          },
        }),
      );
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
          agentDraft = manualAnswers['phrase-preparation-finish-0'] ?? '';
          phase = 'save';
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
      if (agentRunning) {
        body.append(createNotice('Generating phrases…', 'agent'));
        void deps.database.get('roles', roleId).then(async (role) => {
          const mode = createPhrasePreparationMode({
            role: role?.label ?? roleId,
            situation,
            goal,
          });
          if (!mode.ok) {
            body.replaceChildren(createNotice(mode.error.message, 'error'));
            agentRunning = false;
            return;
          }
          const result = await runMode(deps.agent, settings, mode.value);
          agentRunning = false;
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
          panel.append(el('h3', { text: 'Agent suggestions' }));
          result.value.phrases.forEach((phrase) => {
            const p = el('p', { text: `${phrase.kind}: ${phrase.text}` });
            panel.append(p);
          });
          body.replaceChildren(panel);
          const pick = createTextArea('agent-pick', { rows: 4 });
          pick.value = result.value.phrases.map((p) => p.text).join('\n');
          agentDraft = pick.value;
          pick.addEventListener('input', () => {
            agentDraft = pick.value;
          });
          body.append(fieldGroup('Edit before save', pick));
          body.append(
            createButton('Save edited phrase', {
              variant: 'primary',
              onClick: () => {
                phase = 'save';
                paint();
              },
            }),
          );
        });
      }
      return;
    }

    const textArea = createTextArea('final-phrase', { value: agentDraft });
    textArea.addEventListener('input', () => {
      agentDraft = textArea.value;
    });
    body.append(fieldGroup('Phrase to save', textArea));
    body.append(
      createButton('Save phrase', {
        variant: 'primary',
        disabled: agentDraft.trim().length === 0,
        onClick: () => {
          const now = Date.now();
          const phrase: Phrase = {
            id: createId(),
            roleId,
            situation,
            category: 'opener',
            text: agentDraft.trim(),
            note: '',
            source: 'manual',
            archived: false,
            srs: newSrsState(now),
            createdAt: now,
            updatedAt: now,
          };
          void deps.database.put('phrases', phrase).then(() => {
            announce(deps.liveRegion, 'Phrase saved.');
            phase = 'setup';
            agentDraft = '';
            paint();
          });
        },
      }),
    );
  };

  paint();
};
