export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export const createButton = (
  label: string,
  options: {
    variant?: ButtonVariant;
    type?: 'button' | 'submit';
    disabled?: boolean;
    onClick?: () => void;
  } = {},
): HTMLButtonElement => {
  const button = document.createElement('button');
  button.type = options.type ?? 'button';
  button.textContent = label;
  button.className = `btn btn-${options.variant ?? 'secondary'}`;
  if (options.disabled === true) button.disabled = true;
  if (options.onClick) button.addEventListener('click', options.onClick);
  return button;
};
