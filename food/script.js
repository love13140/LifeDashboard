const STORAGE_KEY = 'dashboard-food-items';

const form = document.getElementById('food-form');
const nameInput = document.getElementById('food-name');
const expiryInput = document.getElementById('food-expiry');
const foodList = document.getElementById('food-list');
const emptyState = document.getElementById('food-empty');

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

function getRemainingDays(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiryDate}T00:00:00`);
  const diffMs = expiry - today;

  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getStatus(remainingDays) {
  if (remainingDays < 0) {
    return { level: 'expired', label: '已過期' };
  }
  if (remainingDays === 0) {
    return { level: 'urgent', label: '今天到期' };
  }
  if (remainingDays <= 3) {
    return { level: 'urgent', label: `剩餘 ${remainingDays} 天` };
  }
  if (remainingDays <= 7) {
    return { level: 'warning', label: `剩餘 ${remainingDays} 天` };
  }
  return { level: 'safe', label: `剩餘 ${remainingDays} 天` };
}

function formatDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const daysA = getRemainingDays(a.expiryDate);
    const daysB = getRemainingDays(b.expiryDate);
    if (daysA !== daysB) return daysA - daysB;
    return a.name.localeCompare(b.name, 'zh-Hant');
  });
}

function renderList() {
  const items = sortItems(loadItems());

  foodList.innerHTML = '';

  if (items.length === 0) {
    emptyState.hidden = false;
    foodList.hidden = true;
    return;
  }

  emptyState.hidden = true;
  foodList.hidden = false;

  items.forEach((item) => {
    const remainingDays = getRemainingDays(item.expiryDate);
    const status = getStatus(remainingDays);

    const li = document.createElement('li');
    li.className = `food-item food-item--${status.level}`;
    li.dataset.id = item.id;

    li.innerHTML = `
      <div class="food-item__info">
        <p class="food-item__name">${escapeHtml(item.name)}</p>
        <p class="food-item__date">有效期限：${formatDate(item.expiryDate)}</p>
        <span class="food-item__badge food-item__badge--${status.level}">${status.label}</span>
      </div>
      <button type="button" class="btn-delete" aria-label="刪除 ${escapeHtml(item.name)}">🗑️</button>
    `;

    li.querySelector('.btn-delete').addEventListener('click', () => deleteItem(item.id));
    foodList.appendChild(li);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addItem(name, expiryDate) {
  const items = loadItems();
  items.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: name.trim(),
    expiryDate,
  });
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
  const expiryDate = expiryInput.value;

  if (!name) {
    nameInput.focus();
    return;
  }

  if (!expiryDate) {
    expiryInput.focus();
    return;
  }

  addItem(name, expiryDate);
  form.reset();
  nameInput.focus();
});

renderList();
