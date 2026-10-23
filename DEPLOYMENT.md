# Spend-A-Friend Deployment Guide 🚀

Spend-A-Friend is structured into two clean folders:
- **`backend/`**: Express + Node.js + MongoDB Atlas (Deployed on **Render**)
- **`frontend/`**: React 19 + Vite + Tailwind CSS liquid glass UI (Deployed on **Vercel**)

---

## 1. Backend on Render (Status: LIVE ✅)

- **Live Service URL:** `https://spend-a-friend.onrender.com`
- **API Endpoint:** `https://spend-a-friend.onrender.com/api`
- **Health Check:** `https://spend-a-friend.onrender.com/api/health` (Verified `200 OK`)

Configuration used:
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRE=30d`
  - `NODE_ENV=production`

---

## 2. Deploy the Frontend on Vercel ⚪

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** ➔ **Project** (or open your existing project).
3. Import your GitHub repository: `ReeVNaR/Spend-A-Friend`.
4. Configure the project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose **`frontend`**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://spend-a-friend.onrender.com/api` |
6. Click **Deploy**.

*(Note: `frontend/src/api/axios.js` already includes `https://spend-a-friend.onrender.com/api` as the built-in production fallback, so it works even if the environment variable is omitted!)*

---

## 3. Local Development 💻

To run both backend and frontend concurrently on your computer:

```bash
# 1. Install dependencies for both
npm run install:all

# 2. Run both concurrently
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health check:** http://localhost:5000/api/health
