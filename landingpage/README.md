# Neura — landing page

A standalone static landing page (HTML + CSS + vanilla JS). It doesn't depend on `neura-web` or `neura-api` and has no build step. Everything it needs is in this folder.

```
landingpage/
├── index.html
├── package.json            # only for a local preview server
└── assets/
    ├── css/style.css       # tokens, layout, animations
    ├── js/config.js        # APP_URL: where "Get started" / "Sign in" point
    ├── js/main.js          # smooth scroll, reveals, sticky story, mockup animations
    ├── fonts/              # Geist, Geist Mono, Instrument Serif Italic, Vazirmatn (woff2, self-hosted)
    ├── icons/              # favicon (same as the app)
    └── vendor/             # Lenis 1.1.13 (smooth scroll), lenis.css
```

## Run locally

```bash
cd landingpage
npm run dev        # http://localhost:4321
```

Or open `index.html` directly in a browser.

## Configure

Set the app URL in `assets/js/config.js`:

```js
window.NEURA_CONFIG = { APP_URL: "https://your-neura-web.onrender.com" };
```

Every element with `data-app="/signup"` (or `/login`) links to `APP_URL + path`.

## Deploy

Any static host works. On Render: **New → Static Site**, root directory `landingpage`, no build command, publish directory `.`.

## Notes

- Dark theme only. Colors are CSS variables at the top of `style.css`; the accent is `--accent`.
- `prefers-reduced-motion` turns off smooth scroll and all motion; content stays fully visible.
- Without JavaScript the page still renders (animations are gated behind the `js` class on `<html>`).
- Fonts are licensed under the SIL Open Font License; Lenis is MIT.
