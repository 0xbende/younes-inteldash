# Younes Inteldash

Mining pool intelligence dashboard with real-time data from mempool.space.

## Setup

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" → Import this repo
4. Framework Preset: **Vite** (auto-detected)
5. Click Deploy

The app will be live at `your-project-name.vercel.app` within ~60 seconds.

## Features

- Live BTC price, hashrate, difficulty, fee environment from mempool.space API
- Pool rankings with 7-day block data
- Fee comparison matrix across 10 major pools
- Competitor intelligence profiles with threat levels
- Team intel board with persistent notes (localStorage)

## Data Sources

- [mempool.space API](https://mempool.space/docs/api) — pool rankings, fees, difficulty, mempool stats
- Fee data compiled from official pool documentation and industry sources
