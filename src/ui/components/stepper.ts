export type StepperState = {
  index: number;
  total: number;
};

export const createStepper = (state: StepperState): HTMLElement => {
  const nav = document.createElement('nav');
  nav.className = 'stepper';
  nav.setAttribute('aria-label', 'Worksheet progress');
  const label = document.createElement('p');
  label.className = 'stepper-label';
  label.textContent = `Step ${String(state.index + 1)} of ${String(state.total)}`;
  nav.append(label);
  return nav;
};
