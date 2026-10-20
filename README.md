# 💌 Date invitation

**Live site:** https://h010grams.github.io/date/

A one-page invitation: a letter asking "Will you go on a date with me?", a "of course 😍" button and a "no 😠" button that runs away from the cursor and the finger — it's impossible to press. After "of course", the page shows "Great! I had no doubt…" and all the details of the date.

## What to change and where

| What | Where |
| --- | --- |
| Date and time | `config.js` |
| Place (secret for now) | `config.js` → `place` |
| Texts (letter, plan, dress code, P.S.) | `index.html` |
| Photo | replace `img/us.webp` with your own (portrait works best) |

While no place is set in `config.js`, the "Where are we going?" block says "surprise 🤫" and there is no "how to get there" button. Once you add a name and an address, the address and a map button appear.

The site is published by GitHub Pages from the `gh-pages` branch: after making changes, push them there (`git push origin main:gh-pages`) — the site updates in about a minute.

## Running locally

Open `index.html` in a browser (or use Live Server in VS Code).
To see the details right away without answering the question, add `?yes` to the address.

## Files

- `index.html` — markup and texts
- `style.css` — styling
- `app.js` — logic (the runaway button, hearts, calendar, countdown)
- `config.js` — date, time, place
- `fonts/` — Comforter and Montserrat fonts (SIL Open Font License, see `fonts/OFL.txt`)
- `img/` — photo and link preview image

## Author

**Nikita Kolotusha** — GitHub: [@h010grams](https://github.com/h010grams)
