// 初始化 Supabase 客戶端
const SUPABASE_URL = 'https://tvtmmnkrlbimbmellnis.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NzVvJgdDV_4Fq850JZ9j2g_41cYjE5R';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('food-form');
const nameInput = document.getElementById('food-name');
const expiryInput = document.getElementById('food-expiry');
const foodList = document.getElementById('food-list');
const emptyState = document.getElementById('food-empty');
const btnSubmit = document.getElementById('btn-submit');

// 本地記憶體中的暫存陣列，用來加速畫面渲染 (Optimistic UI)
let cachedItems = [];

// 從雲端撈取最新資料
async function fetchItems() {
  try {
    if (btnSubmit) btnSubmit.textContent = '載入中...';
    
    // 從 Supabase 的 food 資料表撈資料
    const { data, error } = await supabase
      .from('food')
      .select('*');

    if (error) throw error;

    // 將資料庫欄位名稱對應回你原本前端用的屬性 (如 expire_date -> expiryDate)
    cachedItems = data.map(item => ({
      id: item.id,
      name: item.name,
      expiryDate: item.expire_date
    }));

    renderList();
  } catch (err) {
    console.error('讀取雲端資料失敗:', err.message);
  } finally {
    if (btnSubmit) btnSubmit.textContent = '新增';
  }
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
  const items = sortItems(cachedItems);

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

    li.querySelector('.btn-delete').addEventListener('click', () => deleteItem(item.id, item.name));
    foodList.appendChild(li);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 雲端新增功能
async function addItem(name, expiryDate) {
  const trimmedName = name.trim();
  
  // 樂觀更新：先讓前端畫面增加，不用等雲端回傳
  const tempId = String(Date.now());
  cachedItems.push({ id: tempId, name: trimmedName, expiryDate });
  renderList();

  try {
    const { data, error } = await supabase
      .from('food')
      .insert([{ name: trimmedName, expire_date: expiryDate }])
      .select();

    if (error) throw error;
    
    // 成功後將暫時的 ID 換成資料庫真正的 ID
    const index = cachedItems.findIndex(i => i.id === tempId);
    if (index !== -1 && data && data[0]) {
      cachedItems[index].id = data[0].id;
    }
  } catch (err) {
    console.error('雲端新增失敗，重新載入列表:', err.message);
    fetchItems(); // 失敗時重新與雲端校正
  }
}

// 雲端刪除功能 + 跨分頁一鍵連動
async function deleteItem(id, name) {
  // 先在畫面移除
  cachedItems = cachedItems.filter((item) => item.id !== id);
  renderList();

  try {
    const { error } = await supabase
      .from('food')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // 【一鍵連動黑科技】：刪除成功後彈窗詢問是否加入購物清單
    setTimeout(async () => {
      const shouldAddToShopping = confirm(`已經把「${name}」從冰箱移除，需要直接加入購物清單嗎？`);
      if (shouldAddToShopping) {
        try {
          // 直接對 Supabase 的 shopping 資料表做寫入
          const { error: shopError } = await supabase
            .from('shopping')
            .insert([{ name: name, completed: false }]);
          
          if (shopError) throw shopError;
          alert(`已成功將「${name}」加入雲端購物清單！`);
        } catch (err) {
          console.error('連動購物清單失敗:', err.message);
          alert('同步至購物清單時發生錯誤。');
        }
      }
    }, 100);

  } catch (err) {
    console.error('雲端刪除失敗，重新同步:', err.message);
    fetchItems();
  }
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

// 初始化載入
fetchItems();