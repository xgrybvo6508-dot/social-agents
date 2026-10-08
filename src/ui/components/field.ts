export const createLabel = (text: string, forId: string): HTMLLabelElement => {
  const label = document.createElement('label');
  label.htmlFor = forId;
  label.textContent = text;
  return label;
};

export const createTextInput = (
  id: string,
  options: { value?: string; placeholder?: string; type?: string; autocomplete?: string } = {},
): HTMLInputElement => {
  const input = document.createElement('input');
  input.id = id;
  input.name = id;
  input.className = 'field-input';
  input.type = options.type ?? 'text';
  if (options.value !== undefined) input.value = options.value;
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.autocomplete) input.setAttribute('autocomplete', options.autocomplete);
  return input;
};

export const createTextArea = (
  id: string,
  options: { value?: string; rows?: number; placeholder?: string } = {},
): HTMLTextAreaElement => {
  const area = document.createElement('textarea');
  area.id = id;
  area.name = id;
  area.className = 'field-input';
  area.rows = options.rows ?? 4;
  if (options.value !== undefined) area.value = options.value;
  if (options.placeholder) area.placeholder = options.placeholder;
  return area;
};

export const createSelect = (
  id: string,
  items: readonly { value: string; label: string }[],
  selected?: string,
): HTMLSelectElement => {
  const select = document.createElement('select');
  select.id = id;
  select.name = id;
  select.className = 'field-input';
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    if (item.value === selected) option.selected = true;
    select.append(option);
  });
  return select;
};

export const fieldGroup = (
  labelText: string,
  control: HTMLElement,
  hint?: string,
): HTMLDivElement => {
  const wrap = document.createElement('div');
  wrap.className = 'field-group';
  const id = control.id;
  if (id) wrap.append(createLabel(labelText, id));
  wrap.append(control);
  if (hint) {
    const hintEl = document.createElement('p');
    hintEl.className = 'field-hint';
    hintEl.textContent = hint;
    wrap.append(hintEl);
  }
  return wrap;
};
