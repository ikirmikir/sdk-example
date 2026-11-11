# Mosha Mara: an Ikirmikir SDK example

A tiny browser game (swat the Dhaka mosquitoes before dark) that shows the [Ikirmikir game SDK](https://ikirmikir.com/developers/sdk/) 1.3.1, drawn in Ikirmikir's paper and pencil look: pencil rooftops of Dhaka, a yellow sun that sinks, pencil shading that creeps down the sky as dusk falls, ink mosquitoes and a red scribble for each one swatted. Plain HTML, CSS and JavaScript, no build step. Copy anything you like.

- `public/ikirmikir.js` is the SDK file, copied next to the game (the recommended way: the game carries its exact SDK).
- `public/game.js` uses it. Search for `SDK:` to see each call: start-up, loading progress and done, gameplay start and stop, pause and resume, the sound switch, Ikirmikir's click for buttons, the player's name (`ik.player`), the best count in saves (`ik.data`), the leaderboard (`ik.scores.submit` and `rank`, shown after a round) and a score card to share (`ik.share({ score })`).
- A round starts only from the Start or Play again button, never from a tap on the game, and Play again waits a moment after a round so taps still landing don't start the next one.
- Fonts: Kalam and Outfit, both SIL Open Font License 1.1, in `public/fonts/` with their licenses. Sounds are made in code.
- `public/_headers` lets ikirmikir.com show the game in its player (`frame-ancestors`).

Run it locally with any static server, for example `npx serve public`. On its own the SDK runs in local mode; inside the Ikirmikir player it connects. Try it in the [test tool](https://ikirmikir.com/developers/test/).

Hosted on Cloudflare Pages from the `release` branch. Each deployment's own link (`https://<hash>.<project>.pages.dev/`) is what Ikirmikir publishes.

MIT license.
