/*!
 * checklist.js v1.1.0
 * A tiny, dependency-free framework for static checklist pages.
 * Progress is stored in each visitor's own browser (localStorage).
 *
 * Ways to define a list:
 *   1. Hard-coded HTML:  <div data-checklist="id"> <h3>Group</h3><ul><li>Item</li></ul> </div>
 *   2. JavaScript:       Checklist.create('#el', { id, title, items: [...] })
 *   3. JSON file:        <div data-checklist="id" data-src="data/list.json"></div>
 *   4. Import page:      <div data-checklist-importer="id"></div>  (visitor imports a JSON file)
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Styles (injected once, placed first in <head> so your CSS can win).
   * Colours follow the surrounding text colour, so the list works on
   * light and dark pages. Override --cl-accent etc. on .cl to re-theme.
   * ------------------------------------------------------------------ */
  const CSS = `
.cl {
  --cl-accent: #3b5bdb;
  --cl-done: #2f9e5b;
  --cl-line: color-mix(in srgb, currentColor 16%, transparent);
  --cl-edge: color-mix(in srgb, currentColor 32%, transparent);
  --cl-muted: color-mix(in srgb, currentColor 62%, transparent);
  max-width: 40rem; margin: 0 auto; color: inherit;
  font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.cl *, .cl *::before, .cl *::after { box-sizing: border-box; }
.cl-head { margin-bottom: 1.25rem; }
.cl-title { margin: 0 0 .5rem; font-size: 1.6rem; line-height: 1.2; }
.cl-meta { color: var(--cl-muted); font-size: .9rem; font-variant-numeric: tabular-nums; }
.cl-bar { height: 6px; margin-top: .4rem; border-radius: 3px; background: var(--cl-line); overflow: hidden; }
.cl-bar > span { display: block; height: 100%; width: 0; background: var(--cl-accent); transition: width .25s ease, background .25s ease; }
.cl-complete .cl-bar > span { background: var(--cl-done); }
.cl-group { margin-top: 1.75rem; }
.cl-group-title { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin: 0 0 .15rem; font-size: 1.05rem; }
.cl-group-count { color: var(--cl-muted); font-size: .85rem; font-weight: 400; font-variant-numeric: tabular-nums; }
.cl-list { list-style: none; margin: 0; padding: 0; }
.cl-item { display: flex; align-items: flex-start; border-bottom: 1px solid var(--cl-line); }
.cl-label { flex: 1; min-width: 0; display: flex; gap: .8rem; padding: .8rem .25rem; cursor: pointer; }
.cl-input { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); border: 0; }
.cl-box { flex: none; width: 1.5rem; height: 1.5rem; margin-top: .05rem; display: grid; place-items: center;
  border: 2px solid var(--cl-edge); border-radius: 7px; transition: background .12s, border-color .12s; }
.cl-box::after { content: ""; width: .75rem; height: .4rem; margin-top: -.15rem; border: solid #fff; border-width: 0 0 2.5px 2.5px;
  transform: rotate(-45deg) scale(0); transition: transform .12s ease-out; }
.cl-input:checked + .cl-box { background: var(--cl-accent); border-color: var(--cl-accent); }
.cl-input:checked + .cl-box::after { transform: rotate(-45deg) scale(1); }
.cl-input:focus-visible + .cl-box { outline: 3px solid color-mix(in srgb, var(--cl-accent) 50%, transparent); outline-offset: 2px; }
.cl-text { min-width: 0; overflow-wrap: anywhere; }
.cl-input:checked ~ .cl-text { color: var(--cl-muted); text-decoration: line-through; text-decoration-color: var(--cl-edge); }
.cl-text a { color: inherit; text-underline-offset: 2px; }
.cl-del { flex: none; padding: .7rem .65rem; border: 0; border-radius: 6px; background: none; color: var(--cl-muted); font-size: 1.3rem; line-height: 1; cursor: pointer; }
.cl-del:hover { color: inherit; }
.cl-del:focus-visible, .cl-btn:focus-visible, .cl-add input:focus-visible { outline: 3px solid color-mix(in srgb, var(--cl-accent) 50%, transparent); outline-offset: 2px; }
.cl-add { display: flex; gap: .5rem; margin-top: 1.75rem; }
.cl-add input { flex: 1; min-width: 0; padding: .6rem .8rem; border: 1px solid var(--cl-edge); border-radius: 8px; background: transparent; color: inherit; font: inherit; }
.cl-btn { padding: .6rem 1rem; border: 1px solid var(--cl-accent); border-radius: 8px; background: var(--cl-accent); color: #fff; font: inherit; cursor: pointer; }
.cl-btn-quiet { border-color: var(--cl-edge); background: transparent; color: inherit; }
.cl-btn:disabled { opacity: .45; cursor: default; }
.cl-foot { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
@media (prefers-reduced-motion: reduce) { .cl *, .cl *::before, .cl *::after { transition: none !important; } }

/* Importer page: import screen + menu bar */
.cl { --cl-menu-bg: #fff; --cl-menu-fg: #18212f; --cl-danger: #c92a2a; }
.cl-import { max-width: 32rem; padding: 2.5rem 1.25rem; text-align: center; border: 2px dashed var(--cl-edge); border-radius: 14px; transition: background .15s, border-color .15s; }
.cl-import.cl-drag { border-color: var(--cl-accent); background: color-mix(in srgb, var(--cl-accent) 8%, transparent); }
.cl-import .cl-title { margin-bottom: .5rem; }
.cl-import-hint { margin: 0 0 1.5rem; color: var(--cl-muted); }
.cl-btn-big { padding: .8rem 1.6rem; font-size: 1.05rem; }
.cl-error { margin: 1rem 0 0; color: var(--cl-danger); }
.cl-error:empty { display: none; }
.cl-import details { margin-top: 1.5rem; text-align: left; color: var(--cl-muted); font-size: .9rem; }
.cl-import summary { cursor: pointer; text-align: center; }
.cl-import pre { overflow: auto; margin: .75rem 0 0; padding: .75rem; border-radius: 8px; background: var(--cl-line); color: inherit; font-size: .85rem; }
.cl.cl-menubar { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
.cl-menu { position: relative; }
.cl-menu-btn { width: 2.5rem; height: 2.5rem; border: 1px solid transparent; border-radius: 8px; background: none; color: inherit; font-size: 1.4rem; line-height: 1; cursor: pointer; }
.cl-menu-btn:hover, .cl-menu-btn[aria-expanded="true"] { border-color: var(--cl-edge); }
.cl-menu-btn:focus-visible, .cl-menu-item:focus-visible { outline: 3px solid color-mix(in srgb, var(--cl-accent) 50%, transparent); outline-offset: 2px; }
.cl-menu-list { position: absolute; right: 0; top: calc(100% + 4px); z-index: 10; min-width: 12rem; padding: .25rem;
  border: 1px solid var(--cl-edge); border-radius: 10px; background: var(--cl-menu-bg); color: var(--cl-menu-fg); box-shadow: 0 8px 24px rgba(0, 0, 0, .18); }
.cl-menu-list[hidden] { display: none; }
.cl-menu-item { display: block; width: 100%; padding: .6rem .75rem; border: 0; border-radius: 7px; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.cl-menu-item:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
.cl-menu-item.cl-danger { color: var(--cl-danger); }

/* Optional page helper: <body class="cl-page"> */
body.cl-page { margin: 0; padding: 2rem 1rem 4rem; background: #f7f8fa; color: #18212f; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.cl-page a { color: #3b5bdb; }
.cl-page .cl-nav { max-width: 40rem; margin: 0 auto 1.5rem; font-size: .95rem; }
@media (prefers-color-scheme: dark) {
  body.cl-page { background: #12161d; color: #e8ecf3; }
  .cl-page a { color: #8da2ff; }
  .cl { --cl-accent: #4c6ef5; --cl-menu-bg: #1d2430; --cl-menu-fg: #e8ecf3; --cl-danger: #ff8787; }
}
`;

  function injectStyles() {
    if (document.getElementById('cl-styles')) return;
    const style = document.createElement('style');
    style.id = 'cl-styles';
    style.textContent = CSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  function el(tag, className, props) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (props) {
      for (const k in props) {
        if (k === 'text') node.textContent = props[k];
        else node.setAttribute(k, props[k]);
      }
    }
    return node;
  }

  // Small stable hash so items without an explicit id keep their state across reloads.
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  // Accepts a flat list, a list of groups, or a mix:
  //   ['a', { text: 'b', id: 'b1' }, { html: '<a href="#">c</a>' }, { group: 'G', items: [...] }]
  // Returns [{ title, items: [{ id, text, html }] }] with unique ids.
  function normalize(list) {
    const seen = {};
    const groups = [];
    let loose = null;

    function uniq(base) {
      let id = base, n = 1;
      while (seen[id]) id = base + '-' + (++n);
      seen[id] = true;
      return id;
    }
    function toItem(raw) {
      const o = typeof raw === 'string' ? { text: raw } : (raw || {});
      const isHtml = o.html != null;
      const src = String(isHtml ? o.html : (o.text || ''));
      return { id: uniq(o.id ? String(o.id) : hash(src)), text: isHtml ? null : src, html: isHtml ? src : null };
    }

    (list || []).forEach(entry => {
      if (entry && Array.isArray(entry.items)) {
        loose = null;
        groups.push({ title: entry.group || entry.title || '', items: entry.items.map(toItem) });
      } else {
        if (!loose) { loose = { title: '', items: [] }; groups.push(loose); }
        loose.items.push(toItem(entry));
      }
    });
    return groups;
  }

  // Reads hard-coded markup: headings start a group, <ul>/<ol> <li>s are items.
  function parseDom(root) {
    const items = [];
    let current = null;
    Array.from(root.children).forEach(child => {
      if (/^H[1-6]$/.test(child.tagName)) {
        current = { group: child.textContent.trim(), items: [] };
        items.push(current);
      } else if (child.tagName === 'UL' || child.tagName === 'OL') {
        const target = current ? current.items : items;
        Array.from(child.children).forEach(li => {
          if (li.tagName !== 'LI') return;
          target.push({ id: li.getAttribute('data-id') || undefined, html: li.innerHTML.trim() });
        });
      }
    });
    return items;
  }

  // localStorage key: kind + page path + id. The path matters because every repo
  // under <user>.github.io shares one origin.
  function keyFor(kind, id) {
    return [kind, location.pathname.replace(/index\.html$/, ''), id].join(':');
  }

  // localStorage with an in-memory fallback (private mode, blocked storage).
  function makeStore(key) {
    let memory = null;
    return {
      read() {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
        catch (e) { return memory; }
      },
      write(value) {
        memory = value;
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
      },
      clear() {
        memory = null;
        try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
      }
    };
  }

  /* ------------------------------------------------------------------ *
   * Checklist
   * ------------------------------------------------------------------ */
  class Checklist {
    constructor(target, options) {
      const root = typeof target === 'string' ? document.querySelector(target) : target;
      if (!root) throw new Error('Checklist: target not found: ' + target);
      if (root.__checklist) return root.__checklist;
      injectStyles();

      const data = root.dataset;
      this.opts = Object.assign({
        id: data.checklist || root.id || 'default',
        title: data.title || '',
        editable: 'editable' in data && data.editable !== 'false', // visitors may add their own items
        headingLevel: Number(data.headingLevel) || 2,
        customTitle: 'Added by you',
        items: null,           // omit to read items from the element's HTML
        storageKey: null,      // override the generated localStorage key
        onChange: null         // function (state) {}
      }, options);

      this.root = root;
      this.groups = normalize(this.opts.items || parseDom(root));
      this.key = this.opts.storageKey || keyFor('checklist', this.opts.id);
      this.store = makeStore(this.key);
      this.state = this._load();

      // Keep other open tabs of the same page in sync.
      this._onStorage = e => {
        if (e.key === this.key) { this.state = this._load(); this._render(); }
      };
      window.addEventListener('storage', this._onStorage);

      root.__checklist = this;
      this._render();
    }

    /* ---- state ---- */
    _load() {
      const s = this.store.read();
      const ok = s && typeof s === 'object';
      return {
        checked: ok && s.checked && typeof s.checked === 'object' ? s.checked : {},
        custom: ok && Array.isArray(s.custom) ? s.custom : []
      };
    }
    _save() {
      this.store.write({ v: 1, checked: this.state.checked, custom: this.state.custom });
      if (typeof this.opts.onChange === 'function') this.opts.onChange(this.getState());
    }

    /* ---- rendering ---- */
    _render() {
      const { opts, state } = this;
      const level = Math.min(Math.max(opts.headingLevel, 1), 5);
      this.level = level;
      this.view = [];

      const wrap = el('section', 'cl');
      const head = el('header', 'cl-head');
      if (opts.title) head.append(el('h' + level, 'cl-title', { text: opts.title }));
      this.countEl = el('div', 'cl-meta');
      this.barFill = el('span');
      this.bar = el('div', 'cl-bar', { role: 'progressbar', 'aria-label': 'Progress', 'aria-valuemin': 0, 'aria-valuemax': 100 });
      this.bar.append(this.barFill);
      head.append(this.countEl, this.bar);
      wrap.append(head);

      this.groups.forEach(g => wrap.append(this._renderGroup(g, false)));

      if (opts.editable) {
        if (state.custom.length) {
          wrap.append(this._renderGroup({
            title: opts.customTitle,
            items: state.custom.map(c => ({ id: c.id, text: c.text, html: null }))
          }, true));
        }
        wrap.append(this._renderAddForm());
      }

      this.resetBtn = el('button', 'cl-btn cl-btn-quiet', { type: 'button', text: 'Uncheck all' });
      this.resetBtn.addEventListener('click', () => {
        if (confirm('Uncheck all items?')) this.reset();
      });
      const foot = el('div', 'cl-foot');
      foot.append(this.resetBtn);
      wrap.append(foot);

      this.root.textContent = '';
      this.root.append(wrap);
      this.wrap = wrap;
      this._update();
    }

    _renderGroup(group, isCustom) {
      const section = el('div', 'cl-group');
      const entry = { items: [], countEl: null };

      if (group.title) {
        const h = el('h' + Math.min(this.level + 1, 6), 'cl-group-title');
        h.append(el('span', null, { text: group.title }));
        entry.countEl = el('span', 'cl-group-count');
        h.append(entry.countEl);
        section.append(h);
      }

      const ul = el('ul', 'cl-list');
      group.items.forEach(item => {
        const li = el('li', 'cl-item');
        const label = el('label', 'cl-label');
        const input = el('input', 'cl-input', { type: 'checkbox' });
        const text = el('span', 'cl-text');
        if (item.html != null) text.innerHTML = item.html; else text.textContent = item.text;
        label.append(input, el('span', 'cl-box'), text);
        li.append(label);

        input.addEventListener('change', () => {
          if (input.checked) this.state.checked[item.id] = true;
          else delete this.state.checked[item.id];
          this._save();
          this._update();
        });

        if (isCustom) {
          const del = el('button', 'cl-del', { type: 'button', 'aria-label': 'Remove ' + item.text, title: 'Remove', text: '×' });
          del.addEventListener('click', () => {
            this.state.custom = this.state.custom.filter(c => c.id !== item.id);
            delete this.state.checked[item.id];
            this._save();
            this._render();
            this._focusAdd();
          });
          li.append(del);
        }

        ul.append(li);
        entry.items.push({ id: item.id, input });
      });

      section.append(ul);
      this.view.push(entry);
      return section;
    }

    _renderAddForm() {
      const form = el('form', 'cl-add');
      const input = el('input', null, { type: 'text', placeholder: 'Add an item', 'aria-label': 'Add an item', maxlength: 200 });
      const btn = el('button', 'cl-btn', { type: 'submit', text: 'Add' });
      form.append(input, btn);
      form.addEventListener('submit', e => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        this.state.custom.push({ id: 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text });
        this._save();
        this._render();
        this._focusAdd();
      });
      return form;
    }

    _focusAdd() {
      const input = this.wrap && this.wrap.querySelector('.cl-add input');
      if (input) input.focus();
    }

    // Refresh checkboxes, counts and progress without rebuilding the DOM (keeps keyboard focus).
    _update() {
      let total = 0, done = 0;
      this.view.forEach(g => {
        let groupDone = 0;
        g.items.forEach(({ id, input }) => {
          const on = !!this.state.checked[id];
          input.checked = on;
          if (on) groupDone++;
        });
        total += g.items.length;
        done += groupDone;
        if (g.countEl) g.countEl.textContent = groupDone + '/' + g.items.length;
      });
      const pct = total ? Math.round((done / total) * 100) : 0;
      this.countEl.textContent = total && done === total ? 'All done' : done + ' of ' + total + ' done';
      this.barFill.style.width = pct + '%';
      this.bar.setAttribute('aria-valuenow', pct);
      this.wrap.classList.toggle('cl-complete', total > 0 && done === total);
      this.resetBtn.disabled = done === 0;
    }

    /* ---- public API ---- */
    reset() {
      this.state.checked = {};
      this._save();
      this._update();
    }
    getState() {
      return { checked: Object.keys(this.state.checked), custom: this.state.custom.map(c => ({ id: c.id, text: c.text })) };
    }
    destroy() {
      window.removeEventListener('storage', this._onStorage);
      delete this.root.__checklist;
    }
  }

  /* ------------------------------------------------------------------ *
   * Auto-init for <div data-checklist="..."> (and optional data-src JSON)
   * ------------------------------------------------------------------ */
  function autoInit(scope) {
    (scope || document).querySelectorAll('[data-checklist-importer]').forEach(node => {
      if (!node.__clImporter) new ChecklistImporter(node);
    });

    (scope || document).querySelectorAll('[data-checklist]').forEach(node => {
      if (node.__checklist || node.__clLoading) return;
      const src = node.dataset.src;
      if (!src) { new Checklist(node); return; }

      node.__clLoading = true;
      node.textContent = 'Loading…';
      fetch(src)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(json => {
          const opts = { items: Array.isArray(json) ? json : json.items };
          if (json.title && !node.dataset.title) opts.title = json.title;
          new Checklist(node, opts);
        })
        .catch(err => { node.textContent = 'Could not load checklist (' + err.message + ').'; })
        .then(() => { node.__clLoading = false; });
    });
  }

  /* ------------------------------------------------------------------ *
   * Importer: a page with only an "Import" button. The chosen JSON file
   * is validated, stored in this browser and shown as a checklist.
   * "Clear checklist" (in the menu) removes it so a new file can be imported.
   *
   *   <div data-checklist-importer="my-list"></div>
   *   Checklist.importer('#el', { id: 'my-list' })
   *
   * File format: an array of items, or { "title": "...", "items": [...] },
   * with the same item/group shapes as Checklist. Imported files are treated
   * as untrusted: "html" fields are reduced to plain text.
   * ------------------------------------------------------------------ */
  const MAX_IMPORT_BYTES = 1024 * 1024;
  const EXAMPLE_JSON = '{\n  "title": "My checklist",\n  "items": [\n    { "group": "Morning", "items": ["Wake up", "Coffee"] },\n    "A loose item"\n  ]\n}';

  function plainText(html) {
    return new DOMParser().parseFromString(String(html), 'text/html').body.textContent.trim();
  }

  function cleanItems(list, nested) {
    const out = [];
    list.forEach(entry => {
      if (entry && Array.isArray(entry.items)) {
        const inner = cleanItems(entry.items, true);
        if (!inner.length) return;
        if (nested) out.push(...inner); // groups inside groups are flattened
        else out.push({ group: String(entry.group || entry.title || '').slice(0, 200), items: inner });
      } else {
        const o = typeof entry === 'string' ? { text: entry } : (entry || {});
        const text = o.html != null ? plainText(o.html) : String(o.text == null ? '' : o.text).trim();
        if (!text) return;
        const item = { text: text.slice(0, 500) };
        if (o.id != null) item.id = String(o.id).slice(0, 100);
        out.push(item);
      }
    });
    return out;
  }

  function countItems(list) {
    return list.reduce((n, e) => n + (e.items ? e.items.length : 1), 0);
  }

  function parseImport(text) {
    let json;
    try { json = JSON.parse(text); }
    catch (e) { throw new Error('This file is not valid JSON.'); }
    const items = Array.isArray(json) ? json : (json && json.items);
    if (!Array.isArray(items)) {
      throw new Error('No checklist found. The file needs a list of items, or an object with an "items" list.');
    }
    const clean = cleanItems(items, false);
    if (!countItems(clean)) throw new Error('The file contains no items.');
    const title = !Array.isArray(json) && typeof json.title === 'string' ? json.title.trim().slice(0, 200) : '';
    return { v: 1, title, items: clean };
  }

  class ChecklistImporter {
    constructor(target, options) {
      const root = typeof target === 'string' ? document.querySelector(target) : target;
      if (!root) throw new Error('Checklist importer: target not found: ' + target);
      if (root.__clImporter) return root.__clImporter;
      injectStyles();

      const data = root.dataset;
      this.opts = Object.assign({
        id: data.checklistImporter || root.id || 'imported',
        title: data.title || 'Import a checklist', // heading of the import screen
        editable: 'editable' in data && data.editable !== 'false',
        headingLevel: Number(data.headingLevel) || 2,
        onImport: null // function (definition) {}
      }, options);

      this.root = root;
      this.defKey = keyFor('checklist-def', this.opts.id);
      this.stateKey = keyFor('checklist', this.opts.id);
      this.defStore = makeStore(this.defKey);

      // Another tab imported or cleared: follow it.
      this._onStorage = e => { if (e.key === null || e.key === this.defKey) this._render(); };
      window.addEventListener('storage', this._onStorage);

      root.__clImporter = this;
      this._render();
    }

    _loadDef() {
      const def = this.defStore.read();
      return def && Array.isArray(def.items) && def.items.length ? def : null;
    }

    _render() {
      if (this._cleanup) { this._cleanup(); this._cleanup = null; }
      if (this.checklist) { this.checklist.destroy(); this.checklist = null; }
      const def = this._loadDef();
      this.root.textContent = '';
      if (def) this._renderList(def); else this._renderImport();
    }

    _renderImport() {
      const level = Math.min(Math.max(this.opts.headingLevel, 1), 5);
      const wrap = el('section', 'cl cl-import');
      const error = el('p', 'cl-error', { role: 'alert' });
      const input = el('input', null, { type: 'file', accept: '.json,application/json', hidden: '' });
      const button = el('button', 'cl-btn cl-btn-big', { type: 'button', text: 'Import checklist' });

      const details = el('details');
      details.append(el('summary', null, { text: 'Expected file format' }), el('pre', null, { text: EXAMPLE_JSON }));

      wrap.append(
        el('h' + level, 'cl-title', { text: this.opts.title }),
        el('p', 'cl-import-hint', { text: 'Choose a JSON file or drop it here. The checklist is saved in this browser only.' }),
        button, input, error, details
      );

      const handle = file => {
        error.textContent = '';
        if (!file) return;
        if (file.size > MAX_IMPORT_BYTES) { error.textContent = 'This file is too large (limit 1 MB).'; return; }
        file.text()
          .then(parseImport)
          .then(def => {
            this.defStore.write(def);
            this._render();
            if (typeof this.opts.onImport === 'function') this.opts.onImport(def);
          })
          .catch(err => { error.textContent = err.message; });
      };

      button.addEventListener('click', () => input.click());
      input.addEventListener('change', () => { handle(input.files[0]); input.value = ''; });
      wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('cl-drag'); });
      wrap.addEventListener('dragleave', () => wrap.classList.remove('cl-drag'));
      wrap.addEventListener('drop', e => {
        e.preventDefault();
        wrap.classList.remove('cl-drag');
        handle(e.dataTransfer.files[0]);
      });

      this.root.append(wrap);
    }

    _renderList(def) {
      const bar = el('div', 'cl cl-menubar');
      const menu = el('div', 'cl-menu');
      const toggle = el('button', 'cl-menu-btn', { type: 'button', 'aria-label': 'Menu', 'aria-haspopup': 'true', 'aria-expanded': 'false', text: '\u22EE' });
      const list = el('div', 'cl-menu-list', { role: 'menu' });
      list.hidden = true;
      const clearBtn = el('button', 'cl-menu-item cl-danger', { type: 'button', role: 'menuitem', text: 'Clear checklist' });
      list.append(clearBtn);
      menu.append(toggle, list);
      bar.append(menu);

      const setOpen = open => {
        list.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        if (open) clearBtn.focus();
      };
      const onDocClick = e => { if (!menu.contains(e.target)) setOpen(false); };
      const onKey = e => { if (e.key === 'Escape' && !list.hidden) { setOpen(false); toggle.focus(); } };
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKey);
      this._cleanup = () => {
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKey);
      };

      toggle.addEventListener('click', () => setOpen(list.hidden));
      clearBtn.addEventListener('click', () => {
        setOpen(false);
        if (confirm('Clear this checklist?\n\nThe imported list, your progress and any items you added will be removed from this device. You can import a file again afterwards.')) {
          this.clear();
        }
      });

      const host = el('div');
      this.root.append(bar, host);
      this.checklist = new Checklist(host, {
        id: this.opts.id,
        title: def.title,
        items: def.items,
        editable: this.opts.editable,
        headingLevel: this.opts.headingLevel,
        storageKey: this.stateKey
      });
    }

    /* ---- public API ---- */
    // Removes the imported checklist and its progress from this browser (no confirmation).
    clear() {
      if (this.checklist) { this.checklist.destroy(); this.checklist = null; }
      this.defStore.clear();
      makeStore(this.stateKey).clear();
      this._render();
    }
    destroy() {
      window.removeEventListener('storage', this._onStorage);
      if (this._cleanup) { this._cleanup(); this._cleanup = null; }
      if (this.checklist) this.checklist.destroy();
      delete this.root.__clImporter;
    }
  }

  Checklist.importer = (target, options) => new ChecklistImporter(target, options);
  Checklist.create = (target, options) => new Checklist(target, options);
  Checklist.autoInit = autoInit;
  Checklist.version = '1.1.0';
  global.Checklist = Checklist;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => autoInit());
  else autoInit();
})(window);
