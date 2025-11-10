/* Try Local — Gresham
   Simple client-only prototype. Replace with Firebase/FF later.
*/
const state = {
  all: [],
  filtered: [],
  categories: new Set(),
  chips: ["Coffee","Food","Boutique","Services","Outdoors","Wellness","Pets","Family"],
  activeChips: [],
  favorites: new Set(JSON.parse(localStorage.getItem('favs')||'[]')),
};

// Toast notification system
function showToast(message, type = 'success'){
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} toast-show`;
  setTimeout(() => toast.classList.remove('toast-show'), 3000);
}

// Sanitize text for safe HTML insertion
function escapeHtml(text){
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadData(){
  const loader = document.getElementById('loader');
  try {
    loader.hidden = false;
    const res = await fetch('businesses.json');
    const data = await res.json();
    state.all = data;
    state.filtered = data;
    data.forEach(b => b.tags.forEach(t => state.categories.add(t)));
    renderStats();
    renderCategories();
    renderChips();
    populateCategorySelect();
    renderCards();
  } catch(err) {
    showToast('Failed to load businesses. Please refresh.', 'error');
    console.error(err);
  } finally {
    loader.hidden = true;
  }
}

function renderStats(){
  document.getElementById('statBusinesses').textContent = state.all.length;
  document.getElementById('statTags').textContent = new Set(state.all.flatMap(b => b.tags)).size;
  document.getElementById('statNeighborhoods').textContent = new Set(state.all.map(b => b.neighborhood)).size;
}

function renderChips(){
  const row = document.getElementById('chipRow');
  row.innerHTML = '';
  state.chips.forEach(label => {
    const el = document.createElement('button');
    el.className = 'chip';
    if(state.activeChips.includes(label)) el.classList.add('active');
    el.textContent = label;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.onclick = () => toggleChip(label);
    el.onkeydown = (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        toggleChip(label);
      }
    };
    row.appendChild(el);
  });
}

function toggleChip(label){
  if(state.activeChips.includes(label)){
    state.activeChips = state.activeChips.filter(c => c !== label);
  }else{
    state.activeChips.push(label);
  }
  applyFilters();
  renderChips();
}

function applyFilters(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const cat = document.getElementById('categorySelect').value;

  state.filtered = state.all.filter(b => {
    const qMatch = !q || b.name.toLowerCase().includes(q) || b.tags.join(' ').toLowerCase().includes(q);
    const cMatch = !cat || b.tags.includes(cat);
    const chipMatch = state.activeChips.length === 0 || state.activeChips.some(a => b.tags.includes(a));
    return qMatch && cMatch && chipMatch;
  });
  renderCards();
}

function populateCategorySelect(){
  const sel = document.getElementById('categorySelect');
  [...state.categories].sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function createCard(b){
  const article = document.createElement('article');
  article.className = 'card';
  article.setAttribute('tabindex', '0');
  article.setAttribute('aria-label', `${escapeHtml(b.name)} card`);

  const cover = document.createElement('div');
  cover.className = 'cover';
  cover.style.backgroundImage = `url('${escapeHtml(b.cover || 'assets/placeholder.jpg')}')`;
  cover.setAttribute('role', 'img');
  cover.setAttribute('aria-label', escapeHtml(b.name));

  const content = document.createElement('div');
  content.className = 'content';

  const h3 = document.createElement('h3');
  h3.textContent = b.name;

  const meta1 = document.createElement('div');
  meta1.className = 'meta';
  meta1.textContent = `📍 ${b.neighborhood}  •  ⏰ ${b.hours}`;

  const meta2 = document.createElement('div');
  meta2.className = 'meta';
  const phoneLink = document.createElement('a');
  phoneLink.href = `tel:${escapeHtml(b.phone)}`;
  phoneLink.textContent = b.phone;
  const webLink = document.createElement('a');
  webLink.href = escapeHtml(b.website);
  webLink.target = '_blank';
  webLink.rel = 'noopener';
  webLink.textContent = 'Website';
  meta2.append('☎️ ', phoneLink, '  •  🌐 ', webLink);

  const meta3 = document.createElement('div');
  meta3.className = 'meta';
  meta3.textContent = '🔖 ';
  b.tags.forEach(t => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = t;
    meta3.appendChild(tag);
  });

  const actions = document.createElement('div');
  actions.className = 'actions';

  const mapLink = document.createElement('a');
  mapLink.className = 'btn btn-outline';
  mapLink.href = escapeHtml(b.map);
  mapLink.target = '_blank';
  mapLink.rel = 'noopener';
  mapLink.textContent = 'Map';

  const favBtn = document.createElement('button');
  const isFavorited = state.favorites.has(b.id);
  favBtn.className = `btn ${isFavorited ? 'btn-favorited' : 'btn-primary'}`;
  favBtn.innerHTML = isFavorited ? '❤️ Favorited' : '🤍 Favorite';
  favBtn.onclick = () => toggleFavorite(b.id);

  actions.append(mapLink, favBtn);
  content.append(h3, meta1, meta2, meta3, actions);
  article.append(cover, content);

  return article;
}

function renderCards(){
  const wrap = document.getElementById('results');
  wrap.innerHTML = '';
  state.filtered.forEach(b => wrap.appendChild(createCard(b)));
  document.getElementById('emptyState').hidden = state.filtered.length > 0;

  // Update results count
  const count = state.filtered.length;
  const countEl = document.getElementById('resultsCount');
  if(count === state.all.length){
    countEl.textContent = `Showing all ${count} businesses`;
  }else{
    countEl.textContent = `${count} result${count !== 1 ? 's' : ''}`;
  }
}

function renderCategories(){
  const wrap = document.getElementById('categoryGrid');
  wrap.innerHTML = '';
  const byCat = {};
  state.all.forEach(b => b.tags.forEach(t => {
    byCat[t] ??= 0; byCat[t]++;
  }));

  Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,8).forEach(([t,c])=>{
    const card = document.createElement('div');
    card.className = 'category-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.onclick = () => filterByCategory(t);
    card.onkeydown = (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        filterByCategory(t);
      }
    };

    const title = document.createElement('div');
    title.style.fontWeight = '800';
    title.textContent = t;

    const count = document.createElement('div');
    count.style.color = '#444';
    count.textContent = `${c} place${c !== 1 ? 's' : ''}`;

    card.append(title, count);
    wrap.appendChild(card);
  });
}

function filterByCategory(category){
  document.getElementById('categorySelect').value = category;
  applyFilters();
  document.getElementById('discover').scrollIntoView({ behavior: 'smooth' });
}

function toggleFavorite(id){
  if(state.favorites.has(id)){
    state.favorites.delete(id);
    showToast('Removed from favorites', 'info');
  }else{
    state.favorites.add(id);
    showToast('Added to favorites!', 'success');
  }
  localStorage.setItem('favs', JSON.stringify([...state.favorites]));
  renderCards();
}

document.getElementById('searchForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  applyFilters();
});

document.getElementById('openAuth').addEventListener('click', ()=>{
  document.getElementById('authModal').showModal();
});

document.getElementById('btnJoin').addEventListener('click', (e)=>{
  e.preventDefault();
  document.getElementById('authModal').showModal();
});
document.getElementById('btnDemo').addEventListener('click', (e)=>{
  e.preventDefault();
  showToast('Demo store coming soon.', 'info');
});

loadData();
