// Simple HelloFresh-like recipe card renderer (supports single or array)

const els = {
  fileInput: document.getElementById('fileInput'),
  loadSample: document.getElementById('loadSample'),
  printBtn: document.getElementById('printBtn'),
  cards: document.getElementById('cards'),
  tpl: document.getElementById('cardTemplate'),
  pasteBtn: document.getElementById('pasteBtn'),
  pasteDialog: document.getElementById('pasteDialog'),
  pasteText: document.getElementById('pasteText'),
  pasteLoad: document.getElementById('pasteLoad'),
  pasteCancel: document.getElementById('pasteCancel')
};

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

function buildCard(recipe){
  const node = els.tpl.content.firstElementChild.cloneNode(true);

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

  list.forEach(r => {
    const card = buildCard(r);
    els.cards.appendChild(card);
  });
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
els.printBtn.addEventListener('click', () => window.print());

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

// Render sample.json on first load (fallback to inline sample when unavailable)
loadSampleFromDisk();
