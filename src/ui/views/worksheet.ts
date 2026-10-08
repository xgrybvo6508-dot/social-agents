import type { Worksheet, WorksheetStep } from '../../content/worksheets';
import { createButton } from '../components/button';
import { createTextArea, fieldGroup } from '../components/field';
import { createNotice } from '../components/notice';
import { createStepper } from '../components/stepper';
import { el } from '../dom';

export type WorksheetAnswers = Record<string, string>;

export type WorksheetFlowOptions = {
  worksheet: Worksheet;
  answers: WorksheetAnswers;
  stepIndex: number;
  onAnswersChange: (answers: WorksheetAnswers) => void;
  onStepChange: (index: number) => void;
  onComplete?: () => void;
  extraActions?: HTMLElement;
};

const stepFieldId = (step: WorksheetStep, promptIndex: number): string =>
  `${step.id}-${String(promptIndex)}`;

export const renderWorksheetStep = (
  container: HTMLElement,
  options: WorksheetFlowOptions,
): void => {
  const { worksheet, answers, stepIndex, onAnswersChange, onStepChange, onComplete, extraActions } =
    options;
  const step = worksheet.steps[stepIndex];
  if (step === undefined) return;

  container.append(createStepper({ index: stepIndex, total: worksheet.steps.length }));
  container.append(createNotice(worksheet.privacyReminder, 'info'));

  const title = el('h2', { text: step.title });
  container.append(title);
  const instruction = el('p', { className: 'page-intro', text: step.instruction });
  container.append(instruction);

  step.prompts.forEach((prompt, index) => {
    const fieldId = stepFieldId(step, index);
    const area = createTextArea(fieldId, {
      value: answers[fieldId] ?? '',
      rows: 3,
      placeholder: prompt,
    });
    area.addEventListener('input', () => {
      onAnswersChange({ ...answers, [fieldId]: area.value });
    });
    container.append(fieldGroup(prompt, area));
  });

  const actions = el('div', { className: 'page-actions' });
  if (stepIndex > 0) {
    actions.append(
      createButton('Previous step', {
        onClick: () => onStepChange(stepIndex - 1),
      }),
    );
  }
  const isLast = stepIndex >= worksheet.steps.length - 1;
  if (!isLast) {
    actions.append(
      createButton('Next step', {
        variant: 'primary',
        onClick: () => onStepChange(stepIndex + 1),
      }),
    );
  } else {
    actions.append(
      createButton('Finish worksheet', {
        variant: 'primary',
        onClick: () => onComplete?.(),
      }),
    );
    const done = el('p', { className: 'field-hint', text: worksheet.completion });
    container.append(done);
  }
  if (extraActions) actions.append(extraActions);
  container.append(actions);
};
