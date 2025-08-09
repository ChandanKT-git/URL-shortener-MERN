# URL Shortener (MERN)

A full‑stack URL shortener built with MongoDB, Express, React (Vite), and Node.js.
Includes a polished Admin page with safe, robust UI: sortable columns, tooltips, copy buttons, responsive table, and dark mode.

## Features
- Shorten long URLs to shareable links
- Redirects with click counting
- Admin page to view all URLs
  - Sort by Clicks / Created (asc/desc)
  - Search filter with live count
  - Copy short/original URL buttons with toasts
  - Favicon display, tooltips, accessible keyboard navigation
  - Safe layout mode for stable rendering on all screens
- Light/Dark theme toggle

## Tech Stack
- Client: React + Vite
- Server: Node.js + Express
- Database: MongoDB (Atlas/local) via Mongoose

## Monorepo Structure
```
URL-shortener-mern/
├─ client/                # React app (Vite)
├─ server/                # Express API
└─ README.md
```

## Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

## Environment Variables
Create `server/.env` (do NOT commit it). See `server/.env.example` for reference.

Required:
```
PORT=5000
MONGO_URI=<your_mongodb_uri>
BASE_URL=http://localhost:5000
```
Notes:
- If using MongoDB Atlas SRV, you can either specify the DB in the URI (…mongodb.net/urldb?…) or set it via `dbName` in code (already configured as `urldb`).
- Ensure your IP is whitelisted in Atlas during development.

## Install & Run
From project root, in two terminals or using concurrent scripts:

1) Server
```
cd server
npm install
npm start
```
- Logs show: `[DB] Connecting to Mongo...` then `[DB] Connected`

2) Client
```
cd client
npm install
npm run dev
```
- Open the printed local URL (e.g., http://localhost:5173)

## API Endpoints (Server)
- `POST /api/shorten` → `{ longUrl }` → `{ shortcode, shortUrl, originalUrl, clicks }`
- `GET /api/admin/urls` → list of all URLs with metadata
- `GET /:shortcode` → redirects to the original URL and increments click count

## Admin Page Highlights
- File: `client/src/Admin.jsx`
- Styles: `client/src/styles.css`
- Safe mode styles under `.admin-safe` provide:
  - Non-sticky first column for stability
  - Always-visible copy icons
  - Improved truncation / wrapping
  - Consistent zebra striping, sticky header, and accessible focus states

## Development Tips
- Do not commit `server/.env`. A root `.gitignore` is included.
- Keep `server/.env.example` up-to-date without secrets.
- If you change the server port, update `BASE_URL` accordingly.

## Deployment
- Server: deploy to any Node host (Render, Railway, Heroku alternatives, VPS, etc.)
- Client: static hosting (Netlify, Vercel) with `VITE_API_BASE` if you externalize API base.
- Set environment variables on the hosting provider; never commit secrets.

## License
MIT
