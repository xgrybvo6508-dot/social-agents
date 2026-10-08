import { createButton } from './button';

export const confirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void,
): HTMLDialogElement => {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  const heading = document.createElement('h2');
  heading.textContent = title;
  const body = document.createElement('p');
  body.textContent = message;
  const actions = document.createElement('div');
  actions.className = 'dialog-actions';
  const cancel = createButton('Cancel', {
    onClick: () => dialog.close('cancel'),
  });
  const confirm = createButton('Confirm', {
    variant: 'primary',
    onClick: () => {
      dialog.close('confirm');
      onConfirm();
    },
  });
  actions.append(cancel, confirm);
  dialog.append(heading, body, actions);
  return dialog;
};
