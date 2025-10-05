// Simple HelloFresh-like recipe card renderer (supports single or array)

const els = {
  fileInput: document.getElementById('fileInput'),
  loadSample: document.getElementById('loadSample'),
  exportBtn: document.getElementById('exportBtn'),
  exportMenu: document.getElementById('exportMenu'),
  exportPrint: document.getElementById('exportPrint'),
  exportCopyMd: document.getElementById('exportCopyMd'),
  cards: document.getElementById('cards'),
  tpl: document.getElementById('cardTemplate'),
  pasteBtn: document.getElementById('pasteBtn'),
  pasteDialog: document.getElementById('pasteDialog'),
  pasteText: document.getElementById('pasteText'),
  pasteLoad: document.getElementById('pasteLoad'),
  pasteCancel: document.getElementById('pasteCancel'),
  tabRecipes: document.getElementById('tabRecipes'),
  tabIngredients: document.getElementById('tabIngredients'),
  ingredientsView: document.getElementById('ingredientsView')
};

let currentRecipes = [];

const sample = {
  id: "buddha-bowls",
  title: "Sweet Potato & Chickpea Buddha Bowls",
  time: "25–30 min",
  servings: "Serves 4",
  badges: ["Gluten‑Free", "Dairy‑Free", "Vegetarian"],
  theme: "sunset",
  hero: { alt: "Roasted sweet potato, chickpea & quinoa bowls" },
  ingredients: [
    { item: "Sweet potatoes", quantity: "2 medium, peeled & cubed" },
    { item: "Chickpeas", quantity: "1 can, drained & rinsed" },
    { item: "Red bell pepper", quantity: "1, sliced" },
    { item: "Broccoli florets", quantity: "2 cups" },
    { item: "Quinoa", quantity: "1 cup (dry)" },
    { item: "Olive oil", quantity: "2 Tbsp" },
    "Salt, pepper, smoked paprika",
    "Tahini (1/4 cup), 1 lemon, 1 garlic clove, water, salt"
  ],
  steps: [
    "Heat oven to 425°F (220°C). Toss potatoes, chickpeas, pepper & broccoli with oil, salt, pepper, smoked paprika. Roast ~20 min, flip once.",
    "Cook quinoa per package (10–15 min).",
    "Whisk dressing: tahini + lemon juice + minced garlic + water + salt.",
    "Build bowls: quinoa → roasted veg & chickpeas → drizzle dressing."
  ],
  notes: "Great with garlic‑herb grilled chicken; slice and top before serving.",
  nutrition: { calories: "580 kcal", carbs: "78 g", protein: "18 g", fat: "20 g" }
};

function setTheme(theme, el) {
  // Map theme names or tailwind-like gradients to color pairs
  const presets = {
    sunset: ['#fde68a', '#fecaca'],
    ocean: ['#a7f3d0', '#bfdbfe'],
    forest: ['#bbf7d0', '#fef9c3']
  };
  const target = el || document.documentElement;
  let a = getComputedStyle(target).getPropertyValue('--heroA').trim();
  let b = getComputedStyle(target).getPropertyValue('--heroB').trim();
  if (typeof theme === 'string') {
    if (presets[theme]) [a, b] = presets[theme];
    else if (theme.includes('from-') && theme.includes('to-')) {
      // rough mapping of some tailwind-ish tokens
      const map = {
        amber: '#fde68a', rose: '#fecaca', sky: '#bae6fd', emerald: '#a7f3d0', lime: '#bef264'
      };
      const from = Object.keys(map).find(k => theme.includes(`from-${k}`));
      const to = Object.keys(map).find(k => theme.includes(`to-${k}`));
      a = from ? map[from] : a; b = to ? map[to] : b;
    }
  }
  target.style.setProperty('--heroA', a);
  target.style.setProperty('--heroB', b);
}

function sanitizeText(v){ return (v ?? '').toString().trim(); }

function validateRecipe(recipe){
  const errors = [];
  if (!recipe || typeof recipe !== 'object') errors.push('Invalid JSON payload.');
  if (!recipe.title) errors.push('Missing required field: title');
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) errors.push('Missing required field: ingredients');
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) errors.push('Missing required field: steps');
  return errors;
}

function slugifyTitle(title, i){
  const base = (title || '').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const suffix = `-${i+1}`;
  return base ? `${base}${suffix}` : `recipe-${i+1}`;
}

function buildCard(recipe, i){
  const node = els.tpl.content.firstElementChild.cloneNode(true);
  // anchor id for linking from ingredients view
  const id = `recipe-${slugifyTitle(recipe.title, i)}`;
  node.id = id;

  // theme (apply per-card so multiple cards can have different themes)
  const heroEl = node.querySelector('.hero');
  setTheme(recipe.theme || recipe.color, heroEl);

  // header
  node.querySelector('.title').textContent = sanitizeText(recipe.title);
  const timeEl = node.querySelector('.time');
  const servEl = node.querySelector('.servings');
  timeEl.textContent = sanitizeText(recipe.time || '');
  timeEl.classList.toggle('hidden', !recipe.time);
  servEl.textContent = sanitizeText(recipe.servings || '');
  servEl.classList.toggle('hidden', !recipe.servings);

  // badges
  const badgesEl = node.querySelector('.badges');
  badgesEl.innerHTML = '';
  (recipe.badges || []).forEach(b => {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = sanitizeText(b);
    badgesEl.appendChild(span);
  });

  // ingredients
  const ingEl = node.querySelector('.ingredientsList');
  ingEl.innerHTML = '';
  recipe.ingredients.forEach(it => {
    const li = document.createElement('li');
    if (typeof it === 'string') li.textContent = it;
    else if (it && typeof it === 'object') {
      const qty = sanitizeText(it.quantity || it.qty || '');
      const name = sanitizeText(it.item || it.name || '');
      li.textContent = qty && name ? `${qty} — ${name}` : (name || qty);
    } else li.textContent = String(it);
    ingEl.appendChild(li);
  });

  // steps
  const stepsEl = node.querySelector('.stepsList');
  stepsEl.innerHTML = '';
  (recipe.steps || []).forEach(step => {
    const li = document.createElement('li');
    li.textContent = sanitizeText(step);
    stepsEl.appendChild(li);
  });

  // nutrition
  const nWrap = node.querySelector('.nutrition');
  const nList = node.querySelector('.nutritionList');
  nList.innerHTML = '';
  const n = recipe.nutrition;
  if (n && typeof n === 'object') {
    Object.entries(n).forEach(([k,v]) => {
      const li = document.createElement('li');
      li.textContent = `${k[0].toUpperCase()+k.slice(1)}: ${sanitizeText(v)}`;
      nList.appendChild(li);
    });
    nWrap.classList.remove('hidden');
  } else {
    nWrap.classList.add('hidden');
  }

  // notes/pairing
  const notesEl = node.querySelector('.notes');
  const notes = recipe.notes || recipe.chickenPair;
  if (notes) {
    notesEl.textContent = sanitizeText(notes);
    notesEl.classList.remove('hidden');
  } else {
    notesEl.classList.add('hidden');
  }

  return node;
}

function clearCards(){ els.cards.innerHTML = ''; }

function render(data){
  clearCards();
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (data && Array.isArray(data.recipes)) list = data.recipes;
  else list = [data];

  const errs = [];
  list.forEach((r, i) => {
    const e = validateRecipe(r);
    if (e.length) errs.push(`Recipe ${i+1}:\n` + e.map(x=>` - ${x}`).join('\n'));
  });
  if (errs.length) { alert(errs.join('\n\n')); return; }

  currentRecipes = list;

  list.forEach((r, i) => {
    const card = buildCard(r, i);
    els.cards.appendChild(card);
  });

  // If ingredients tab is active, re-render it
  if (!els.ingredientsView.classList.contains('hidden')) {
    renderIngredientsView();
  }
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      render(data);
    } catch (e) {
      alert('Could not parse JSON: ' + e.message);
    }
  };
  reader.readAsText(file);
}

// Hooks
els.fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) readFile(file);
});

async function loadSampleFromDisk() {
  try {
    const res = await fetch('recipes/sample.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(data);
  } catch (err) {
    console.warn('Failed to load recipes/sample.json:', err);
    // Fallback to built-in sample for direct file:// usage
    alert('Could not load recipes/sample.json. Using built-in sample.\nIf opening via file://, try: python -m http.server');
    render(sample);
  }
}

els.loadSample.addEventListener('click', () => loadSampleFromDisk());

// Export menu
function toggleExportMenu(show){
  const open = show ?? els.exportMenu.classList.contains('hidden');
  els.exportMenu.classList.toggle('hidden', !open);
}
els.exportBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  toggleExportMenu();
});
document.addEventListener('click', (e) => {
  if (!els.exportMenu) return;
  if (e.target === els.exportBtn || els.exportMenu.contains(e.target)) return;
  els.exportMenu.classList.add('hidden');
});
els.exportPrint?.addEventListener('click', () => { toggleExportMenu(false); window.print(); });

function str(v){ return (v ?? '').toString(); }

// Toasts
function showToast(message, type){
  const host = document.getElementById('toast');
  if (!host) return;
  const node = document.createElement('div');
  node.className = `toast-item ${type || ''}`.trim();
  node.textContent = message;
  host.appendChild(node);
  // let layout apply, then animate
  requestAnimationFrame(() => node.classList.add('show'));
  const ttl = 2500;
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 200);
  }, ttl);
}

function recipeToMarkdown(r){
  const lines = [];
  lines.push(`# ${str(r.title).trim()}`);
  const meta = [];
  if (r.time) meta.push(`Time: ${str(r.time)}`);
  if (r.servings) meta.push(`Servings: ${str(r.servings)}`);
  if (meta.length) lines.push(meta.join(' • '));
  if (Array.isArray(r.badges) && r.badges.length) lines.push(r.badges.map(b=>`_${str(b)}_`).join(' '));
  lines.push('');
  lines.push('## Ingredients');
  (r.ingredients||[]).forEach(it => {
    if (typeof it === 'string') lines.push(`- ${it}`);
    else if (it && typeof it === 'object') {
      const qty = str(it.quantity || it.qty || '').trim();
      const name = str(it.item || it.name || '').trim();
      lines.push(`- ${qty && name ? `${qty} — ${name}` : (name || qty)}`);
    } else {
      lines.push(`- ${String(it)}`);
    }
  });
  lines.push('');
  lines.push('## Steps');
  (r.steps||[]).forEach((s,i)=> lines.push(`${i+1}. ${str(s).trim()}`));
  if (r.notes) { lines.push(''); lines.push('> ' + str(r.notes).trim()); }
  if (r.nutrition && typeof r.nutrition === 'object'){
    lines.push('');
    lines.push('## Nutrition (per serving)');
    Object.entries(r.nutrition).forEach(([k,v])=> lines.push(`- ${k[0].toUpperCase()+k.slice(1)}: ${str(v).trim()}`));
  }
  lines.push('');
  return lines.join('\n');
}

function activeViewIsIngredients(){
  return !els.ingredientsView.classList.contains('hidden');
}

function ingredientsIndexToMarkdown(){
  const groups = computeIngredientGroups(currentRecipes);
  const keys = Array.from(groups.keys()).sort((a,b)=> a.localeCompare(b));
  const lines = ['# Ingredients Index',''];
  keys.forEach(k => {
    const g = groups.get(k);
    lines.push(`## ${g.name}`);
    g.entries.forEach(en => {
      const qty = en.qty ? `${en.qty} — ` : '';
      lines.push(`- ${qty}${en.recipeTitle}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

async function copyMarkdown(){
  const md = activeViewIsIngredients()
    ? ingredientsIndexToMarkdown()
    : (currentRecipes || []).map(recipeToMarkdown).join('\n\n---\n\n');
  try {
    await navigator.clipboard.writeText(md);
    showToast('Markdown copied to clipboard.', 'success');
  } catch (err) {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = md; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast('Markdown copied to clipboard.', 'success'); }
    catch(e){ showToast('Could not copy markdown.', 'error'); }
    finally { document.body.removeChild(ta); }
  }
}

els.exportCopyMd?.addEventListener('click', () => { toggleExportMenu(false); copyMarkdown(); });

// Paste JSON flow
function openPasteDialog(){
  els.pasteDialog.showModal();
  setTimeout(() => els.pasteText?.focus(), 0);
}

function closePasteDialog(){
  els.pasteDialog.close();
}

function loadFromPastedText(){
  const text = els.pasteText.value;
  try {
    const data = JSON.parse(text);
    render(data);
    closePasteDialog();
  } catch (e) {
    alert('Could not parse JSON: ' + e.message);
  }
}

els.pasteBtn?.addEventListener('click', openPasteDialog);
els.pasteCancel?.addEventListener('click', (e) => {
  e.preventDefault();
  closePasteDialog();
});
els.pasteLoad?.addEventListener('click', (e) => {
  e.preventDefault();
  loadFromPastedText();
});

// Ctrl+Enter (and Cmd+Enter) submits the paste dialog
els.pasteText?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    loadFromPastedText();
  }
});

// Ingredients tab
function computeIngredientGroups(recipes){
  const map = new Map();
  recipes.forEach((r, i) => {
    const recipeId = `recipe-${slugifyTitle(r.title, i)}`;
    const title = sanitizeText(r.title);
    (r.ingredients || []).forEach(it => {
      let name = '';
      let qty = '';
      if (typeof it === 'string') {
        name = sanitizeText(it);
      } else if (it && typeof it === 'object') {
        name = sanitizeText(it.item || it.name || '');
        qty = sanitizeText(it.quantity || it.qty || '');
      }
      if (!name) return;
      const key = name.toLowerCase();
      if (!map.has(key)) map.set(key, { name, entries: [] });
      map.get(key).entries.push({ qty, recipeTitle: title, recipeId });
    });
  });
  return map;
}

function renderIngredientsView(){
  const root = els.ingredientsView;
  root.innerHTML = '';
  const groups = computeIngredientGroups(currentRecipes);
  const keys = Array.from(groups.keys()).sort((a,b)=> a.localeCompare(b));
  keys.forEach(k => {
    const g = groups.get(k);
    const wrap = document.createElement('div');
    wrap.className = 'ingredient-group';
    const h = document.createElement('h3');
    h.textContent = g.name;
    const ul = document.createElement('ul');
    g.entries.forEach(en => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${en.recipeId}`;
      a.textContent = (en.qty ? `${en.qty} — ${en.recipeTitle}` : en.recipeTitle);
      li.appendChild(a);
      ul.appendChild(li);
    });
    wrap.appendChild(h);
    wrap.appendChild(ul);
    root.appendChild(wrap);
  });
}

function showRecipes(){
  els.cards.classList.remove('hidden');
  els.ingredientsView.classList.add('hidden');
  els.tabRecipes?.classList.add('active');
  els.tabIngredients?.classList.remove('active');
}

function showIngredients(){
  els.cards.classList.add('hidden');
  els.ingredientsView.classList.remove('hidden');
  els.tabRecipes?.classList.remove('active');
  els.tabIngredients?.classList.add('active');
  renderIngredientsView();
}

els.tabRecipes?.addEventListener('click', showRecipes);
els.tabIngredients?.addEventListener('click', showIngredients);

// If a link in the ingredients view is clicked, switch to Recipes and scroll to card
els.ingredientsView?.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  const href = a?.getAttribute('href') || '';
  if (a && href.startsWith('#recipe-')) {
    e.preventDefault();
    const target = href;
    showRecipes();
    // Wait for layout, then scroll to the target card (works even if hash was already set)
    requestAnimationFrame(() => {
      const el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Update the URL hash without triggering another scroll
      if (location.hash !== target) history.replaceState(null, '', target);
    });
  }
});

// Render sample.json on first load (fallback to inline sample when unavailable)
loadSampleFromDisk();
