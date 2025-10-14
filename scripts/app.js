// ----- Elements & State -----
const els = {
  landing: document.getElementById('landing'),
  app: document.getElementById('app'),
  startBtn: document.getElementById('startBtn'),
  search: document.getElementById('searchInput'),
  results: document.getElementById('results'),
  panel: document.getElementById('panel'),
  filterBtn: document.getElementById('filterBtn'),
  closePanel: document.getElementById('closePanel'),
  resetBtn: document.getElementById('resetBtn'),
  applyBtn: document.getElementById('applyBtn'),
  chips: document.querySelectorAll('.chip'),
  summary: document.getElementById('activeSummary'),
  cardTpl: document.getElementById('cardTpl'),
  sortSelect: document.getElementById('sortSelect'),
  // PDP
  pdp: document.getElementById('pdp'),
  pdpClose: document.getElementById('pdpClose'),
  pdpTitle: document.getElementById('pdpTitle'),
  pdpPrice: document.getElementById('pdpPrice'),
  pdpHeat: document.getElementById('pdpHeat'),
  pdpSauce: document.getElementById('pdpSauce'),
  sauceList: document.getElementById('sauceList'),
  pdpAddons: document.getElementById('pdpAddons'),
  addonList: document.getElementById('addonList'),
  qtyMinus: document.getElementById('qtyMinus'),
  qtyPlus: document.getElementById('qtyPlus'),
  qtyVal: document.getElementById('qtyVal'),
  addToCart: document.getElementById('addToCart'),
  recoList: document.getElementById('recoList'),
  // Cart
  cartBtn: document.getElementById('cartBtn'),
  cartBadge: document.getElementById('cartBadge'),
  cart: document.getElementById('cart'),
  cartClose: document.getElementById('cartClose'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal')
};

const state = {
  q: "",
  filters: { category:new Set(), protein:new Set(), base:new Set(), price:"", promo:false },
  sort: "recommended",
  products: [],
  cart: JSON.parse(localStorage.getItem('cart')||"[]"),
  pdp: { id:null, qty:1, heat:null, sauce:null, addons:[] }
};

// ----- Init -----
// Landing -> App
els.startBtn.addEventListener('click', (e)=>{
  e.preventDefault();
  els.landing.classList.add('hidden');
  els.app.classList.remove('hidden');
  document.getElementById('app').scrollIntoView({behavior:'smooth', block:'start'});
  els.search.focus();
});

// Load products
fetch('data/products.json').then(r=>r.json()).then(data=>{ state.products = data; render(); });

// Search
els.search.addEventListener('input', e=>{ state.q = e.target.value.trim(); render(); });

// Chips
els.chips.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const k = btn.dataset.chip;
    state.filters[k] = !state.filters[k];
    btn.classList.toggle('active', state.filters[k]);
    render();
  });
});

// Panel
els.filterBtn.addEventListener('click', ()=> els.panel.classList.add('open'));
els.closePanel.addEventListener('click', ()=> els.panel.classList.remove('open'));
els.applyBtn.addEventListener('click', ()=>{
  ['category','protein','base'].forEach(name=>{
    const set = new Set();
    document.querySelectorAll(`input[name="${name}"]:checked`).forEach(i=>set.add(i.value));
    state.filters[name] = set;
  });
  const price = document.querySelector('input[name="price"]:checked');
  state.filters.price = price ? price.value : "";
  state.filters.promo = !!document.querySelector('input[name="promo"]:checked');
  els.panel.classList.remove('open'); render();
});
els.resetBtn.addEventListener('click', ()=>{
  state.filters = {category:new Set(), protein:new Set(), base:new Set(), price:"", promo:false};
  document.querySelectorAll('#panel input').forEach(i=>{
    if(i.type==='checkbox') i.checked=false;
    if(i.type==='radio' && i.value==="") i.checked=true; else if(i.type==='radio') i.checked=false;
  });
  els.chips.forEach(c=>c.classList.remove('active'));
  render();
});
els.sortSelect.addEventListener('change', e=>{ state.sort = e.target.value; render(); });

// Cart UI
els.cartBtn.addEventListener('click', ()=> els.cart.classList.add('open'));
els.cartClose.addEventListener('click', ()=> els.cart.classList.remove('open'));

// ----- Core Render -----
function render(){
  let list = filterProducts(state.products, state);
  list = sortProducts(list, state.sort);
  renderSummary();
  renderCards(list);
  updateCartBadge();
}

function filterProducts(items, st){
  const q = st.q.toLowerCase();
  const f = st.filters;
  return items.filter(p=>{
    if(q){
      const inName = p.name.toLowerCase().includes(q);
      const inTags = (p.tags||[]).some(t=> t.toLowerCase().includes(q));
      if(!(inName || inTags)) return false;
    }
    if(f.promo && !p.promo) return false;
    if(f.price){
      if(f.price==='lte30' && !(p.price<=30)) return false;
      if(f.price==='31to50' && !(p.price>=31 && p.price<=50)) return false;
      if(f.price==='gt50' && !(p.price>50)) return false;
    }
    if(f.category.size && !f.category.has(p.category)) return false;
    if(f.protein.size && !f.protein.has(p.protein)) return false;
    if(f.base.size && p.base !== null && !f.base.has(p.base)) return false;
    return true;
  });
}

function sortProducts(list, mode){
  const arr = [...list];
  if(mode==='price_asc') arr.sort((a,b)=>a.price-b.price);
  else if(mode==='price_desc') arr.sort((a,b)=>b.price-a.price);
  else if(mode==='promo_first') arr.sort((a,b)=>(b.promo?1:0)-(a.promo?1:0));
  return arr;
}

function renderSummary(){
  const parts = []; const f = state.filters;
  if(f.category.size) parts.push('หมวด: '+[...f.category].join('/'));
  if(f.protein.size) parts.push('โปรตีน: '+[...f.protein].join('/'));
  if(f.base.size) parts.push('ฐาน: '+[...f.base].join('/'));
  if(f.price) parts.push('ราคา: '+(f.price==='lte30'?'≤30':f.price==='31to50'?'31–50':'>50'));
  if(f.promo) parts.push('มีโปร');
  if(state.q) parts.push('ค้นหา: '+state.q);
  const el = els.summary;
  if(parts.length){ el.textContent='กำลังกรอง: '+parts.join(' · '); el.classList.remove('hide'); }
  else el.classList.add('hide');
}

function renderCards(list){
  els.results.innerHTML = '';
  if(!list.length){
    const empty = document.createElement('div');
    empty.className='empty';
    empty.textContent='ไม่พบผลลัพธ์ ลองลบหรือผ่อนเงื่อนไขบางอย่าง';
    els.results.appendChild(empty);
    return;
  }
  list.forEach(p=>{
    const card = els.cardTpl.content.cloneNode(true);
    card.querySelector('.title').textContent = p.name;
    card.querySelector('.price').textContent = '฿'+p.price;
    if(p.promo) card.querySelector('.badge.promo').classList.remove('hide');

    // >>> ใส่รูปลงการ์ด
    const thumb = card.querySelector('.thumb');
    if (p.image) {
      const im = document.createElement('img');
      im.src = p.image;
      im.alt = p.name;
      im.loading = 'lazy';
      // fallback ถ้ารูปเสีย
      im.onerror = ()=> { thumb.innerHTML = '<div class="ph">IMG</div>'; };
      thumb.innerHTML = '';
      thumb.appendChild(im);
    }

    const el = card.querySelector('.card');
    el.addEventListener('click', ()=> openPDP(p.id));
    els.results.appendChild(card);
  });
}


// ----- PDP -----
function openPDP(pid){
  const p = state.products.find(x=>x.id===pid);
  if(!p) return;
  state.pdp = { id:p.id, qty:1, heat: p.heatable ? 'อุ่น' : null, sauce:null, addons:[] };
  els.qtyVal.textContent = '1';
  els.pdpTitle.textContent = p.name;
  els.pdpPrice.textContent = '฿'+p.price;
  els.pdpTitle.textContent = p.name;
els.pdpPrice.textContent = '฿'+p.price;

// >>> แสดงภาพฮีโร่บน PDP
const hero = document.querySelector('.pdp-hero .hero-img');
hero.innerHTML = p.image ? `<img src="${p.image}" alt="${p.name}">` : 'IMG';

  // heatable
  toggleBlock(els.pdpHeat, !!p.heatable);
  if(p.heatable){
    els.pdpHeat.querySelectorAll('.seg-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.heat==='อุ่น');
      b.onclick = ()=> els.pdpHeat.querySelectorAll('.seg-btn').forEach(btn=>{
        btn.classList.toggle('active', btn===b);
        state.pdp.heat = b.dataset.heat;
      });
    });
  }
  // sauces
  els.sauceList.innerHTML='';
  toggleBlock(els.pdpSauce, !!(p.options && p.options.sauces && p.options.sauces.length));
  if(p.options && p.options.sauces){
    p.options.sauces.forEach((name,i)=>{
      const btn = document.createElement('button');
      btn.className='seg-btn';
      btn.textContent = name;
      if(i===0){ btn.classList.add('active'); state.pdp.sauce = name; }
      btn.onclick = ()=>{
        els.sauceList.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        state.pdp.sauce = name;
      };
      els.sauceList.appendChild(btn);
    });
  }
  // addons
  els.addonList.innerHTML='';
  toggleBlock(els.pdpAddons, !!(p.options && p.options.addons && p.options.addons.length));
  if(p.options && p.options.addons){
    p.options.addons.forEach(name=>{
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type='checkbox'; cb.value=name;
      cb.onchange = ()=>{
        if(cb.checked) state.pdp.addons.push(name);
        else state.pdp.addons = state.pdp.addons.filter(x=>x!==name);
      };
      label.appendChild(cb);
      label.appendChild(document.createTextNode(name));
      els.addonList.appendChild(label);
    });
  }
  // qty handlers
  els.qtyMinus.onclick = ()=>{ if(state.pdp.qty>1){ state.pdp.qty--; els.qtyVal.textContent=String(state.pdp.qty);} };
  els.qtyPlus.onclick = ()=>{ state.pdp.qty++; els.qtyVal.textContent=String(state.pdp.qty); };
  // add to cart
  els.addToCart.onclick = ()=>{
    addCurrentToCart();
    closePDP();
  };
  // reco
  renderRecommendations(p);
  // open
  els.pdp.classList.remove('hidden');
}
function closePDP(){ els.pdp.classList.add('hidden'); }
els.pdpClose.addEventListener('click', closePDP);

// ปิดเมื่อคลิกพื้นหลัง
document.querySelector('.sheet-backdrop').addEventListener('click', closePDP);

// ปิดด้วยปุ่ม Esc
window.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && !els.pdp.classList.contains('hidden')) closePDP();
});

function toggleBlock(el, show){ el.classList.toggle('hidden', !show); }

// Recommendations
// Recommendations
function renderRecommendations(p){
  const all = state.products.filter(x => x.id !== p.id);

  // 1) พยายามหยิบ "ฐานอาหารเดียวกัน" ก่อน (เช่น ข้าว/เส้น)
  let sameBase = [];
  if (p.base) sameBase = all.filter(x => x.base && x.base === p.base);

  // ถ้ายังไม่พอ 2 ชิ้น ให้เติมด้วย "หมวดเดียวกัน"
  const sameCategory = all.filter(x => x.category === p.category && !sameBase.includes(x));

  // รวมแล้วตัดมา 2 ชิ้นแรก
  const similar = [...sameBase, ...sameCategory].slice(0, 2);

  // 2) ชิ้นที่ 3 ให้ข้ามหมวด (กระตุ้นซื้อข้ามประเภท)
  const cross = all.filter(x => x.category !== p.category);
  const crossPick = cross[Math.floor(Math.random() * cross.length)] || null;

  const recos = [...similar];
  if (crossPick) recos.push(crossPick);

  // render การ์ดแนะนำ
  els.recoList.innerHTML = '';
  recos.forEach(r => {
    const card = document.getElementById('cardTpl').content.cloneNode(true);
    card.querySelector('.title').textContent = r.name;
    card.querySelector('.price').textContent = '฿' + r.price;
    if (r.promo) card.querySelector('.badge.promo').classList.remove('hide');

    // ใส่รูปลง .thumb (เหมือนกับ renderCards)
    const thumb = card.querySelector('.thumb');
    if (r.image) {
      const im = document.createElement('img');
      im.src = r.image;
      im.alt = r.name;
      im.loading = 'lazy';
      im.onerror = () => { thumb.innerHTML = '<div class="ph">IMG</div>'; };
      thumb.innerHTML = '';
      thumb.appendChild(im);
    }

    card.querySelector('.card').addEventListener('click', () => openPDP(r.id));
    els.recoList.appendChild(card);
  });
}


// ----- Cart -----
function addCurrentToCart(){
  const p = state.products.find(x=>x.id===state.pdp.id);
  if(!p) return;

  // กำหนดราคา addon แบบง่าย (ปรับเพิ่มได้อนาคต)
  const ADDON_PRICES = { "เพิ่มไข่ต้ม": 5 };

  // รวมราคา addon ที่เลือก
  const addonsSelected = state.pdp.addons || [];
  const addonExtra = addonsSelected.reduce((s,name)=> s + (ADDON_PRICES[name]||0), 0);

  // ราคาต่อชิ้นจริง = ราคา base + ราคา addon ที่เลือก
  const unitPrice = p.price + addonExtra;

  const entry = {
    id: p.id,
    name: p.name,
    price: unitPrice,            // เก็บราคา “หลังรวม addon”
    qty: state.pdp.qty,
    heat: state.pdp.heat,
    sauce: state.pdp.sauce,
    addons: addonsSelected
  };
  state.cart.push(entry);
  persistCart();
  updateCartBadge();
  renderCart();
}


function persistCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }
function updateCartBadge(){
  const count = state.cart.reduce((n,it)=> n+it.qty, 0);
  els.cartBadge.textContent = String(count);
  els.cartBadge.classList.toggle('hide', count===0);
}
function renderCart(){
  els.cartItems.innerHTML='';
  if(state.cart.length===0){
    els.cartItems.textContent='ยังไม่มีสินค้าในตะกร้า';
  }else{
    state.cart.forEach((it,idx)=>{
      const row = document.createElement('div');
      row.className='cart-item';
      const left = document.createElement('div');
      left.innerHTML = `<div><strong>${it.name}</strong></div>` +
        `<div style="font-size:12px;color:#666">${[it.heat, it.sauce, ...(it.addons||[])].filter(Boolean).join(' · ')}</div>` +
        `<div style="font-size:12px;color:#666">x${it.qty}</div>`;
      const right = document.createElement('div');
      right.innerHTML = `<div>฿${it.price*it.qty}</div>`;
      const del = document.createElement('button');
      del.textContent='ลบ'; del.className='ghost';
      del.onclick = ()=>{ state.cart.splice(idx,1); persistCart(); updateCartBadge(); renderCart(); };
      right.appendChild(del);
      row.appendChild(left); row.appendChild(right);
      els.cartItems.appendChild(row);
    });
  }
  const total = state.cart.reduce((s,it)=> s + it.price*it.qty, 0);
  els.cartTotal.textContent = 'รวม: ฿'+total;
}

// initial render of cart contents
renderCart(); updateCartBadge();
// ไปหน้า Checkout จาก Cart (มี guard กัน element ไม่มี)
const goCheckoutBtn = document.getElementById('checkoutBtn');
if (goCheckoutBtn) {
  goCheckoutBtn.addEventListener('click', ()=>{
    if(state.cart.length===0){
      alert('ยังไม่มีสินค้าในตะกร้า');
      return;
    }
    window.location.href = 'checkout.html';
  });
}

