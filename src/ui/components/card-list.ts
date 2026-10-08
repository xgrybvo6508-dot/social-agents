export type CardItem = {
  id: string;
  title: string;
  description?: string;
};

export const createCardList = (
  items: readonly CardItem[],
  onSelect: (id: string) => void,
  selectedId?: string,
): HTMLUListElement => {
  const list = document.createElement('ul');
  list.className = 'card-list';
  items.forEach((item) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'card-list-item';
    if (item.id === selectedId) button.classList.add('is-selected');
    const title = document.createElement('span');
    title.className = 'card-list-title';
    title.textContent = item.title;
    button.append(title);
    if (item.description) {
      const desc = document.createElement('span');
      desc.className = 'card-list-desc';
      desc.textContent = item.description;
      button.append(desc);
    }
    button.addEventListener('click', () => onSelect(item.id));
    li.append(button);
    list.append(li);
  });
  return list;
};
