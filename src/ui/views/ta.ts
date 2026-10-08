import { AgentError } from '../../agent/errors';
import type { TaResponse } from '../../agent/schemas/ta';
import { runMode } from '../../agent/run-mode';
import { TA_CARDS } from '../../content/ta-cards';
import { WORKSHEETS } from '../../content/worksheets';
import { createId } from '../../lib/ids';
import { createTaMode } from '../../modes/ta';
import type { TaFixation } from '../../memory/types';
import { createButton } from '../components/button';
import { createSelect, createTextArea, fieldGroup } from '../components/field';
import { createNotice } from '../components/notice';
import { announce, backLink, el } from '../dom';
import type { ModeViewDeps } from './mode-deps';
import { renderWorksheetStep, type WorksheetAnswers } from './worksheet';

const worksheet = WORKSHEETS.find((w) => w.mode === 'transactional-analysis');
if (worksheet === undefined) throw new Error('TA worksheet is missing.');

type Phase = 'setup' | 'path' | 'manual' | 'agent' | 'decision';

const renderAgentPanel = (parent: HTMLElement, value: TaResponse): void => {
  const panel = el('div', { className: 'agent-panel' });
  panel.append(el('h3', { text: 'Tentative reading (not a verdict)' }));

  panel.append(el('h4', { text: 'Observations' }));
  value.observations.forEach((item) => {
    panel.append(el('p', { text: `${item.observation} — evidence: ${item.evidence}` }));
  });

  if (value.hypotheses.length > 0) {
    panel.append(el('h4', { text: 'Hypotheses' }));
    value.hypotheses.forEach((item) => {
      panel.append(
        el('p', {
          text: `${item.lens} (${item.confidence}): ${item.reading}. Alternative: ${item.ordinaryAlternative}. Unknown: ${item.unknown}`,
        }),
      );
    });
  }

  if (value.voices.length > 0) {
    panel.append(el('h4', { text: 'Voices' }));
    value.voices.forEach((item) => {
      panel.append(el('p', { text: `${item.speaker} (${item.voice}): ${item.statement}` }));
    });
  }

  panel.append(el('h4', { text: 'Wants and boundaries' }));
  panel.append(el('p', { text: `Mine: ${value.wants.mine.join('; ')}` }));
  panel.append(el('p', { text: `Others possible: ${value.wants.othersPossible.join('; ')}` }));
  panel.append(el('p', { text: `Boundaries: ${value.wants.boundaries.join('; ')}` }));

  panel.append(el('h4', { text: 'Options' }));
  value.options.forEach((item) => {
    panel.append(el('p', { text: `${item.action} — tradeoff: ${item.tradeoff}` }));
  });

  panel.append(el('p', { text: value.summary }));
  panel.append(el('p', { text: value.decisionPrompt }));
  parent.append(panel);
};

const referenceCards = (): HTMLElement => {
  const wrap = el('section', { className: 'reference-cards' });
  wrap.append(el('h2', { text: 'TA reference cards' }));
  TA_CARDS.forEach((card) => {
    const item = el('article', { className: 'reference-card' });
    item.append(el('h4', { text: card.title }));
    item.append(el('p', { text: card.definition }));
    item.append(el('p', { text: `Does not mean: ${card.doesNotMean}` }));
    item.append(el('p', { text: `Caution: ${card.caution}` }));
    wrap.append(item);
  });
  return wrap;
};

export const renderTa = (container: HTMLElement, deps: ModeViewDeps): void => {
  container.append(backLink());
  let phase: Phase = 'setup';
  let scope: 'person' | 'group' = 'person';
  let purpose = '';
  let observations = '';
  let wants = '';
  let manualStep = 0;
  let manualAnswers: WorksheetAnswers = {};
  let decision = '';
  let agentResult: TaResponse | null = null;
  let agentSummary = '';

  const body = el('div');
  container.append(body);

  const paint = (): void => {
    body.replaceChildren();

    if (phase === 'setup') {
      body.append(
        el('p', {
          className: 'page-intro',
          text: 'TA is a tentative lens, not a diagnosis. You choose the decision.',
        }),
      );
      body.append(createNotice(worksheet.privacyReminder, 'info'));
      const scopeSelect = createSelect(
        'ta-scope',
        [
          { value: 'person', label: 'One person' },
          { value: 'group', label: 'A group' },
        ],
        scope,
      );
      scopeSelect.addEventListener('change', () => {
        scope = scopeSelect.value as 'person' | 'group';
      });
      const purposeArea = createTextArea('ta-purpose', { value: purpose, rows: 2 });
      purposeArea.addEventListener('input', () => {
        purpose = purposeArea.value;
      });
      const obs = createTextArea('ta-observations', { value: observations, rows: 4 });
      obs.addEventListener('input', () => {
        observations = obs.value;
      });
      const wantsArea = createTextArea('ta-wants', { value: wants, rows: 3 });
      wantsArea.addEventListener('input', () => {
        wants = wantsArea.value;
      });
      body.append(
        fieldGroup('Scope', scopeSelect),
        fieldGroup('Purpose', purposeArea),
        fieldGroup('Observations', obs),
        fieldGroup('Your wants and boundaries', wantsArea),
      );
      body.append(
        createButton('Continue', {
          variant: 'primary',
          onClick: () => {
            phase = 'path';
            paint();
          },
        }),
      );
      body.append(referenceCards());
      return;
    }

    if (phase === 'path') {
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
          onClick: () => {
            phase = 'agent';
            paint();
          },
        }),
      );
      body.append(actions);
      body.append(referenceCards());
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
          agentSummary = Object.values(manualAnswers).join('\n');
          agentResult = null;
          phase = 'decision';
          paint();
        },
      });
      body.append(referenceCards());
      return;
    }

    if (phase === 'agent') {
      body.append(createNotice(worksheet.privacyReminder, 'info'));
      const settings = deps.getSettings();
      if (settings.apiKey.length === 0) {
        body.append(createNotice('Add an API key in Settings to use the agent.', 'warn'));
        body.append(referenceCards());
        return;
      }
      body.append(createNotice('Building TA lens…', 'agent'));
      const mode = createTaMode({
        scope,
        purpose,
        observations,
        wantsAndBoundaries: wants,
      });
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
        agentResult = result.value;
        agentSummary = result.value.summary;
        body.replaceChildren();
        renderAgentPanel(body, result.value);
        body.append(referenceCards());
        body.append(
          createButton('Write my decision', {
            variant: 'primary',
            onClick: () => {
              phase = 'decision';
              paint();
            },
          }),
        );
      });
      return;
    }

    if (agentResult !== null) {
      renderAgentPanel(body, agentResult);
    } else if (agentSummary.length > 0) {
      body.append(el('p', { className: 'field-hint', text: agentSummary }));
    }
    const area = createTextArea('ta-decision', { value: decision, rows: 4 });
    area.addEventListener('input', () => {
      decision = area.value;
    });
    body.append(fieldGroup('Your decision', area));
    body.append(referenceCards());
    body.append(
      createButton('Save fixation', {
        variant: 'primary',
        disabled: decision.trim().length === 0,
        onClick: () => {
          const now = Date.now();
          const obsLines = agentResult
            ? agentResult.observations.map((o) => `${o.observation} (${o.evidence})`)
            : observations.split('\n').filter((line) => line.trim().length > 0);
          const hypotheses = agentResult
            ? agentResult.hypotheses.map(
                (h) =>
                  `${h.lens}: ${h.reading}. Alt: ${h.ordinaryAlternative}. Unknown: ${h.unknown}`,
              )
            : [agentSummary].filter((line) => line.length > 0);
          const voices = agentResult
            ? agentResult.voices.map((v) => `${v.speaker} (${v.voice}): ${v.statement}`)
            : [];
          const options = agentResult
            ? agentResult.options.map((o) => `${o.action} — ${o.tradeoff}`)
            : [];
          const fixation: TaFixation = {
            id: createId(),
            scope,
            subjectIds: [],
            observations: obsLines,
            hypotheses,
            voices,
            options,
            decision: decision.trim(),
            createdAt: now,
            updatedAt: now,
          };
          void deps.database.put('taFixations', fixation).then(() => {
            announce(deps.liveRegion, 'Fixation saved.');
            phase = 'setup';
            decision = '';
            agentResult = null;
            agentSummary = '';
            paint();
          });
        },
      }),
    );
  };

  paint();
};
