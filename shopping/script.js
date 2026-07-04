const STORAGE_KEY = 'dashboard-shopping-items';

const form = document.getElementById('shopping-form');
const nameInput = document.getElementById('shopping-name');
const shoppingList = document.getElementById('shopping-list');
const emptyState = document.getElementById('shopping-empty');

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return 0;
  });
}

function renderList() {
  const items = sortItems(loadItems());

  shoppingList.innerHTML = '';

  if (items.length === 0) {
    emptyState.hidden = false;
    shoppingList.hidden = true;
    return;
  }

  emptyState.hidden = true;
  shoppingList.hidden = false;

  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = `shopping-item${item.done ? ' shopping-item--done' : ''}`;
    li.dataset.id = item.id;

    li.innerHTML = `
      <label class="shopping-item__check">
        <input
          type="checkbox"
          class="shopping-item__checkbox"
          ${item.done ? 'checked' : ''}
          aria-label="標記 ${escapeHtml(item.name)} 為已購買"
        >
        <span class="shopping-item__checkmark" aria-hidden="true"></span>
      </label>
      <button type="button" class="shopping-item__name">${escapeHtml(item.name)}</button>
      <button type="button" class="btn-delete" aria-label="刪除 ${escapeHtml(item.name)}">🗑️</button>
    `;

    const checkbox = li.querySelector('.shopping-item__checkbox');
    const nameBtn = li.querySelector('.shopping-item__name');
    const deleteBtn = li.querySelector('.btn-delete');

    checkbox.addEventListener('change', () => toggleItem(item.id));
    nameBtn.addEventListener('click', () => toggleItem(item.id));
    deleteBtn.addEventListener('click', () => deleteItem(item.id));

    shoppingList.appendChild(li);
  });
}

function addItem(name) {
  const items = loadItems();
  items.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: name.trim(),
    done: false,
  });
  saveItems(items);
  renderList();
}

function toggleItem(id) {
  const items = loadItems().map((item) =>
    item.id === id ? { ...item, done: !item.done } : item
  );
  saveItems(items);
  renderList();
}

function deleteItem(id) {
  const items = loadItems().filter((item) => item.id !== id);
  saveItems(items);
  renderList();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }

  addItem(name);
  form.reset();
  nameInput.focus();
});

renderList();
