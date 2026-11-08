# Mosha Mara: an Ikirmikir SDK example

A tiny browser game (swat the Dhaka mosquitoes before dark) that shows every call of the [Ikirmikir game SDK](https://ikirmikir.com/developers/sdk/) 1.0. Plain HTML and JavaScript, no build step, no asset files. Copy anything you like.

- `public/ikirmikir.js` is the SDK file, copied next to the game (the recommended way: the game carries its exact SDK).
- `public/game.js` uses it. Search for `SDK:` to see each call: start-up, loading progress and done, gameplay start and stop, pause and resume, the sound switch, player context and share.
- `public/_headers` lets ikirmikir.com show the game in its player (`frame-ancestors`).

Run it locally with any static server, for example `npx serve public`. On its own the SDK runs in local mode; inside the Ikirmikir player it connects. Try it in the [test tool](https://ikirmikir.com/developers/test/).

Hosted on Cloudflare Pages from the `release` branch. Each deployment's own link (`https://<hash>.<project>.pages.dev/`) is what Ikirmikir publishes.

MIT license.
