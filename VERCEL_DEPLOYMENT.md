# 🚀 Deploying Spend-A-Friend to Vercel

Spend-A-Friend has been fully optimized as a **single unified full-stack application** on Vercel:
- **Frontend**: React + Vite + Tailwind CSS compiled to static assets and served globally via Vercel's Edge CDN.
- **Backend**: Express API deployed as **Vercel Serverless Functions** (`/api/index.js`) with connection caching for MongoDB Atlas.

---

## 📋 Prerequisites
1. A GitHub account.
2. A free [Vercel account](https://vercel.com).
3. Your MongoDB Atlas connection string (already configured in `.env`).

---

## ⚡ 3-Step Deployment Guide

### Step 1: Push Code to GitHub

Open your terminal in the project root (`Spend-A-Friend`) and run:

```bash
git init
git add .
git commit -m "Initial commit - Spend-A-Friend fullstack app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

*(Note: `.env` and `node_modules` are automatically ignored by `.gitignore`)*

---

### Step 2: Import into Vercel

1. Log in to [vercel.com](https://vercel.com) and click **"Add New..."** ➔ **"Project"**.
2. Select your GitHub repository (`Spend-A-Friend`) and click **"Import"**.
3. **Leave "Root Directory" as `./` (default)**. All settings in `vercel.json` will be detected automatically!

---

### Step 3: Add Environment Variables in Vercel

In the Vercel project configuration screen, open the **Environment Variables** section and add:

| Key | Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://ranveerghorpade16_db_user:Ranveer%401516@expencetracker.s8aiybj.mongodb.net/spend-a-friend?retryWrites=true&w=majority` | MongoDB Atlas URI |
| `JWT_SECRET` | `spend_a_friend_super_secure_jwt_secret_dev_2026_xyz!@#` *(or generate your own)* | Secret for auth tokens |
| `JWT_EXPIRE` | `30d` | Token expiry duration |

Click **"Deploy"**! 🎉

Within ~60 seconds, your application will be live at `https://your-project.vercel.app`!

---

## 🛠️ How It Works on Vercel

- **Vercel Serverless Function** (`/api/index.js`):
  - Every API request (`/api/*`) is routed automatically to `api/index.js`.
  - Database connections are cached across lambda invocations using `mongoose` connection pooling (`server/db.js`).
  - Dual-mounted routes (`/api/...` and `/...`) prevent route mismatch regardless of how Vercel proxies the request.
- **Vite Static SPA** (`client/dist`):
  - Rewrites in `vercel.json` direct all browser page loads (`/groups`, `/friends`, `/dashboard`) to `/index.html` for client-side routing.
  - Zero CORS configuration needed in production because the frontend and backend share the exact same domain origin!

---

## 💻 Local Development

To run both backend and frontend together locally with a single command:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health
