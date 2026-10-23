# Spend-A-Friend Deployment Guide 🚀

Spend-A-Friend is structured into two clean folders:
- **`backend/`**: Express + Node.js + MongoDB Atlas (Deployed on **Render**)
- **`frontend/`**: React 19 + Vite + Tailwind CSS liquid glass UI (Deployed on **Vercel**)

---

## 1. Deploy the Backend on Render 🟢

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository: `https://github.com/ReeVNaR/Spend-A-Friend`.
4. Configure the service settings:
   - **Name:** `spend-a-friend-backend` (or your preferred name)
   - **Region:** Choose the region closest to you (e.g., *Singapore / Frankfurt / Oregon*)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `MONGODB_URI` | `mongodb+srv://ranveerghorpade16_db_user:Ranveer%401516@expencetracker.s8aiybj.mongodb.net/spend-a-friend?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `spend_a_friend_super_secure_jwt_secret_dev_2026_xyz!@#` | Secret key for signing tokens |
   | `JWT_EXPIRE` | `30d` | Token lifetime |
   | `NODE_ENV` | `production` | Production environment |
6. Click **Create Web Service**.
7. Once deployed, Render will provide a public URL like:
   `https://spend-a-friend-backend.onrender.com`
   - Test it by visiting: `https://spend-a-friend-backend.onrender.com/api/health`
   - It will return: `{"success": true, "status": "healthy", ...}`

---

## 2. Deploy the Frontend on Vercel ⚪

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository: `ReeVNaR/Spend-A-Friend`.
4. Configure the project settings:
   - **Project Name:** `spend-a-friend`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and set it to **`frontend`**
   - **Build Command:** `npm run build` (or `vite build`)
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://spend-a-friend-backend.onrender.com/api` | Point to your live Render backend URL with `/api` |
6. Click **Deploy**.
7. Your app is now live with real-time multi-device database synchronization!

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
