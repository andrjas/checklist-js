# checklist.js

A tiny, dependency-free framework for hosting checklist pages on GitHub Pages.
One JS file, no build step. Each visitor's progress is saved in their own browser (`localStorage`), so nothing is sent to a server and nothing is shared between devices.

## Deploy

1. Put `checklist.js` and your HTML pages in a GitHub repo.
2. Repo **Settings → Pages → Deploy from a branch → `main` / root**.
3. Your pages are live at `https://<user>.github.io/<repo>/`.

## Add a checklist page

Include the script, then define the list in one of three ways. Use a different `id` for each list on the same page.

### 1. Hard-coded HTML

```html
<script src="checklist.js" defer></script>

<div data-checklist="packing" data-title="Packing list" data-editable>
  <h2>Documents</h2>
  <ul>
    <li data-id="passport">Passport</li>
    <li>Tickets</li>
  </ul>
  <h2>Clothes</h2>
  <ul>
    <li>Rain jacket</li>
  </ul>
</div>
```

Headings start groups. List items can contain links and other inline HTML.

### 2. JavaScript (dynamic)

```html
<div id="list"></div>
<script>
  Checklist.create('#list', {
    id: 'release',
    title: 'Release checklist',
    editable: true,
    items: [
      'Update changelog',                                  // plain item
      { id: 'tests', text: 'Tests pass' },                 // item with explicit id
      { html: 'See <a href="/docs">the docs</a>' },        // item with HTML
      { group: 'Deploy', items: ['Migrate', 'Ship'] }      // group
    ]
  });
</script>
```

### 3. JSON file

```html
<div data-checklist="groceries" data-src="data/groceries.json"></div>
```

```json
{ "title": "Groceries", "items": [ { "group": "Fresh", "items": ["Apples", "Bread"] } ] }
```

The JSON can also be a plain array of items. `fetch` needs a web server, so test locally with `python3 -m http.server`.

## Options

| Option (JS) | HTML attribute | Default | Meaning |
|---|---|---|---|
| `id` | `data-checklist` | element id | Unique name of the list on its page |
| `title` | `data-title` | none | Heading shown above the list |
| `editable` | `data-editable` | `false` | Lets visitors add and remove their own items |
| `headingLevel` | `data-heading-level` | `2` | Level of the title heading (groups use one level lower) |
| `items` | contents / `data-src` | read from HTML | Items and groups |
| `customTitle` | none | `Added by you` | Heading for visitor-added items |
| `storageKey` | none | generated | Override the localStorage key |
| `onChange` | none | none | `function (state) {}` called after every change |

Instance methods: `reset()`, `getState()`, `destroy()`.

## How data is stored

- Key: `checklist:<page path>:<id>`. The page path is included because every repo under `<user>.github.io` shares one origin.
- Stored value: the ids of checked items, plus any items the visitor added.
- Item ids are a hash of the item text unless you set `id` / `data-id`. **If you reword an item, give it an id first** (set it to the old hash or any stable name), otherwise visitors lose that tick.
- Data lives per browser and per device. Clearing site data or using private browsing removes it. Open tabs of the same page stay in sync.

## Styling

Colours follow the surrounding text colour, so lists work on light and dark pages. Re-theme with CSS variables:

```css
.cl { --cl-accent: #d6336c; --cl-done: #0ca678; }
```

`<body class="cl-page">` is an optional ready-made page style (light/dark background, `<nav class="cl-nav">` for a back link). Skip it if you have your own layout.

## Security note

HTML items (`<li>` contents, `html:` fields, JSON `html`) are inserted as HTML, which is fine for content you wrote in your own repo. Items typed in by visitors are always inserted as plain text.
