# Rift Rarity

An unofficial League of Legends fan trivia game. Answer 7 prompts in 25 seconds each — the more obscure your valid answer, the higher your rank (from **Bronze** to **Challenger**) and the further you travel across Summoner's Rift toward the Enemy Nexus.

Rift Rarity is a 100% static front-end web app. It fetches live patch data and artwork directly from Riot's public Data Dragon CDN and synthesizes all sound effects in-browser with the Web Audio API.

---

## Run Locally

### Prerequisites
- Node.js 18+ and npm

### Steps
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Build for Production

```bash
npm run build
```
This outputs the static site into the **`dist`** folder (`dist/`).

---

## Deploy to Netlify

## Firebase Scoreboard & Google Sign-In on Your Live URL

- Anonymous play and adaptive community answer rarity work out of the box on your deployed site using the bundled `firebase-applet-config.json`.
- To enable **Google Sign-In** for submitting scores to the Hall of Summoners from your deployed URL, add your live domain (e.g. `your-site.netlify.app` or `yourusername.github.io`) in **Firebase Console -> Authentication -> Settings -> Authorized domains**.

---

## Verifying Lore & Fact Lists

All canonical Runeterra region memberships, lore groupings, ability mechanic lists, and hand-tuned popularity rankings live in a single file for easy review:
- `src/data/loreAndFacts.ts`

---

*Rift Rarity is an unofficial fan project and is not endorsed by Riot Games. Riot Games, League of Legends, and all associated properties are trademarks of Riot Games, Inc.*
