import { AgentError } from '../../agent/errors';
import { runMode } from '../../agent/run-mode';
import { WORKSHEETS } from '../../content/worksheets';
import { createPhraseTrainingMode } from '../../modes/phrase-training';
import { pickDuePhrases } from '../../memory/phrase-picker';
import { reviewPhrase } from '../../memory/phrase-srs';
import type { Phrase, ReviewGrade } from '../../memory/types';
import { createButton } from '../components/button';
import { createNotice } from '../components/notice';
import { announce, backLink, el } from '../dom';
import type { ModeViewDeps } from './mode-deps';
import { renderWorksheetStep, type WorksheetAnswers } from './worksheet';

const worksheet = WORKSHEETS.find((w) => w.mode === 'phrase-training');
if (worksheet === undefined) throw new Error('Phrase training worksheet is missing.');

type Phase = 'pick' | 'cue' | 'recall' | 'reveal' | 'grade' | 'manual' | 'agent';

export const renderPhraseTraining = (container: HTMLElement, deps: ModeViewDeps): void => {
  container.append(backLink());
  let phase: Phase = 'pick';
  let phrase: Phrase | undefined;
  let recalled = '';
  let lapsedThisSession = false;
  let manualStep = 0;
  let manualAnswers: WorksheetAnswers = {};

  const body = el('div');
  container.append(body);

  const paint = (): void => {
    body.replaceChildren();

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
          announce(deps.liveRegion, 'Worksheet complete. Nothing was scheduled.');
          phase = 'pick';
          paint();
        },
      });
      return;
    }

    if (phase === 'pick') {
      void deps.database.getAll('phrases').then((phrases) => {
        body.replaceChildren();
        const due = pickDuePhrases(phrases, Date.now(), 'training');
        body.append(
          el('p', {
            className: 'page-intro',
            text: 'Practise one phrase. Grading updates the schedule.',
          }),
        );
        if (due.length === 0) {
          body.append(createNotice('No phrases yet. Prepare phrases first.', 'info'));
        } else {
          const first = due[0];
          if (first === undefined) return;
          body.append(createNotice(`Next due: ${first.text}`, 'info'));
          phrase = first;
          body.append(
            createButton('Practise this phrase', {
              variant: 'primary',
              onClick: () => {
                phase = 'cue';
                paint();
              },
            }),
          );
        }
        body.append(
          createButton('Offline worksheet', {
            onClick: () => {
              phase = 'manual';
              manualStep = 0;
              paint();
            },
          }),
        );
      });
      return;
    }

    if (phrase === undefined) {
      body.append(createNotice('Choose a phrase first.', 'warn'));
      return;
    }

    if (phase === 'cue') {
      body.append(el('p', { className: 'page-intro', text: phrase.situation }));
      body.append(
        createButton('Start recall', {
          variant: 'primary',
          onClick: () => {
            phase = 'recall';
            paint();
          },
        }),
      );
      return;
    }

    if (phase === 'recall') {
      const area = document.createElement('textarea');
      area.className = 'field-input';
      area.rows = 3;
      area.addEventListener('input', () => {
        recalled = area.value;
      });
      body.append(area);
      body.append(
        createButton('Reveal saved phrase', {
          variant: 'primary',
          onClick: () => {
            phase = 'reveal';
            paint();
          },
        }),
      );
      return;
    }

    if (phase === 'reveal') {
      body.append(el('p', { text: `Saved phrase: ${phrase.text}` }));
      body.append(
        el('p', { className: 'field-hint', text: `Your attempt: ${recalled || '(empty)'}` }),
      );
      const actions = el('div', { className: 'page-actions' });
      actions.append(
        createButton('Self-grade', {
          variant: 'primary',
          onClick: () => {
            phase = 'grade';
            paint();
          },
        }),
        createButton('Optional agent feedback', {
          onClick: () => {
            phase = 'agent';
            paint();
          },
        }),
      );
      body.append(actions);
      return;
    }

    if (phase === 'grade') {
      body.append(el('p', { text: 'Grade 0 = forgot, 5 = easy recall.' }));
      const row = el('div', { className: 'grade-row' });
      ([0, 1, 2, 3, 4, 5] as ReviewGrade[]).forEach((grade) => {
        row.append(
          createButton(String(grade), {
            onClick: () => {
              if (phrase === undefined) return;
              const current = phrase;
              const now = Date.now();
              const next = reviewPhrase(current.srs, grade, now, current.id, lapsedThisSession);
              if (grade <= 2) lapsedThisSession = true;
              const updated: Phrase = { ...current, srs: next, updatedAt: now };
              void deps.database.put('phrases', updated).then(() => {
                announce(deps.liveRegion, 'Schedule updated.');
                phrase = undefined;
                recalled = '';
                lapsedThisSession = false;
                phase = 'pick';
                paint();
              });
            },
          }),
        );
      });
      body.append(row);
      return;
    }

    const settings = deps.getSettings();
    if (settings.apiKey.length === 0) {
      body.append(createNotice('Add an API key in Settings for agent feedback.', 'warn'));
      return;
    }
    body.append(createNotice('Loading agent feedback…', 'agent'));
    const mode = createPhraseTrainingMode({
      scenario: phrase.situation,
      phrase: phrase.text,
    });
    if (!mode.ok) {
      body.replaceChildren(createNotice(mode.error.message, 'error'));
      return;
    }
    void runMode(deps.agent, settings, mode.value).then((result) => {
      if (result.status === 'manual-fallback') {
        body.replaceChildren(
          createNotice(
            result.error instanceof AgentError ? result.error.message : 'Agent unavailable.',
            'error',
          ),
        );
        return;
      }
      const panel = el('div', { className: 'agent-panel' });
      panel.append(el('h3', { text: 'Practice feedback' }));
      panel.append(el('p', { text: result.value.partnerReply }));
      panel.append(el('p', { text: `Clarity: ${result.value.feedback.clarity}` }));
      body.replaceChildren(panel);
      body.append(
        createButton('Back to self-grade', {
          variant: 'primary',
          onClick: () => {
            phase = 'grade';
            paint();
          },
        }),
      );
    });
  };

  paint();
};
