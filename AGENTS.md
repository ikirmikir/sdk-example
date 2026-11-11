# AGENTS.md

For any coding agent working on Mosha Mara. Read this first, every session.

## What this is

Mosha Mara: swat the Dhaka mosquitoes before dark, a 30-second one-player game on [Ikirmikir](https://ikirmikir.com) and its open example of the game SDK (saves, a leaderboard, the place after a round, a score card to share). Plain HTML, CSS and JavaScript in `public/`, no build step. MIT, public repo: anyone may copy it.

## Read before changing anything

1. The game builder guide: https://ikirmikir.com/developers/game-guide.md (rules, the paper and pencil look, the SDK, how a version goes live). Follow it.
2. `README.md`, then `public/game.js` (search for `SDK:`).
3. `git status` and `git log -10`. Never trust memory of an earlier conversation over the repo.

## How it works

- `public/ikirmikir.js` is the Ikirmikir game SDK 1.3.1, copied from https://ikirmikir.com/sdk/1.3.1/ikirmikir.js. Never edit it; replace it with a newer published file.
- The game draws on a canvas in pencil (`game.js`: rooftops once per screen size, the sun, dusk shading, mosquitoes, scribbles). Menus are HTML over it (`index.html`, `style.css`).
- A round starts only from Start or Play again, never from a tap on the game (Maruf, 2026-11-12); Play again waits a moment after a round.
- After every round: `ik.scores.submit("mosquitoes", score)`, then `ik.scores.rank` for the place. The board on Ikirmikir allows at most 150, and 6 a second of play: keep the game inside those limits or ask Maruf to change them.
- The best count is kept with `ik.data` (an older version used `localStorage`; it is read once and moved).

## Testing

- Run: `npx serve public` (or any static server).
- Inside Ikirmikir: deploy, then paste the `https://` link in https://ikirmikir.com/developers/test/. Check a whole round, the place line, Share, the sound switch, pausing, and that a stray tap never starts a round.
- Check phone (375 px) and desktop widths.

## Rules

- Change gameplay only when asked. Keep the paper and pencil look.
- Commits as `Maruf <hi@maruf.ing>`, no AI co-author or "generated with" lines. Ask Maruf before pushing: `release` deploys to Cloudflare Pages (project `sdk-example`), and a new version goes live only when Maruf adds its fixed link on Ikirmikir.
- Plain English in text, no em dashes. Record any outside asset and its license in `README.md`.
