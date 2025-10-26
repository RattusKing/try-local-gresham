/* Try Local — Gresham
   Simple client-only prototype. Replace with Firebase/FF later.
*/
const state = {
  all: [],
  filtered: [],
  categories: new Set(),
  chips: ["Coffee","Food","Boutique","Services","Outdoors","Wellness","Pets","Family"],
};

async function loadData(){
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
    el.textContent = label;
    el.onclick = () => {
      const isActive = el.classList.toggle('active');
      const active = [...row.querySelectorAll('.chip.active')].map(c => c.textContent);
      if(active.length){
        state.filtered = state.all.filter(b => active.some(a => b.tags.includes(a)));
      }else{
        state.filtered = state.all.slice();
      }
      renderCards();
    };
    row.appendChild(el);
  });
}

function populateCategorySelect(){
  const sel = document.getElementById('categorySelect');
  [...state.categories].sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function cardTemplate(b){
  const bg = b.cover || 'assets/placeholder.jpg';
  const tags = b.tags.map(t => `<span class="tag">${t}</span>`).join('');
  return `
  <article class="card" tabindex="0" aria-label="${b.name} card">
    <div class="cover" style="background-image:url('${bg}')" role="img" aria-label="${b.name}"></div>
    <div class="content">
      <h3>${b.name}</h3>
      <div class="meta">📍 ${b.neighborhood} &nbsp; • &nbsp; ⏰ ${b.hours}</div>
      <div class="meta">☎️ <a href="tel:${b.phone}">${b.phone}</a> &nbsp; • &nbsp; 🌐 <a href="${b.website}" target="_blank" rel="noopener">Website</a></div>
      <div class="meta">🔖 ${tags}</div>
      <div class="actions">
        <a class="btn btn-outline" href="${b.map}" target="_blank" rel="noopener">Map</a>
        <button class="btn btn-primary" onclick="favorite('${b.id}')">Favorite</button>
      </div>
    </div>
  </article>`;
}

function renderCards(){
  const wrap = document.getElementById('results');
  wrap.innerHTML = state.filtered.map(cardTemplate).join('');
  document.getElementById('emptyState').hidden = state.filtered.length > 0;
}

function renderCategories(){
  const wrap = document.getElementById('categoryGrid');
  const byCat = {};
  state.all.forEach(b => b.tags.forEach(t => {
    byCat[t] ??= 0; byCat[t]++;
  }));
  wrap.innerHTML = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([t,c])=>`
    <div class="category-card">
      <div style="font-weight:800">${t}</div>
      <div style="color:#444">${c} places</div>
    </div>
  `).join('');
}

function favorite(id){
  const favs = new Set(JSON.parse(localStorage.getItem('favs')||'[]'));
  if(favs.has(id)){favs.delete(id)}else{favs.add(id)}
  localStorage.setItem('favs', JSON.stringify([...favs]));
  alert('Updated favorites!');
}

document.getElementById('searchForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const cat = document.getElementById('categorySelect').value;
  state.filtered = state.all.filter(b => {
    const qMatch = !q || b.name.toLowerCase().includes(q) || b.tags.join(' ').toLowerCase().includes(q);
    const cMatch = !cat || b.tags.includes(cat);
    return qMatch && cMatch;
  });
  renderCards();
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
  alert('Demo store coming soon.');
});

loadData();
