# 🎲 Ride the Bus - Real-Time Multiplayer Web App

## 🛠 Tech Stack
- Backend: Node.js, Express, Socket.io
- Frontend: React, TailwindCSS, Vite
- Hosting: Render (backend), Vercel (frontend)
- No database — game state in memory

---

## 🚀 Deployment

### 📡 Backend (Render)
1. Go to https://render.com
2. Create a new **Web Service**
3. Connect your GitHub repo
4. Root directory: `/server`
5. Build command: `npm install`
6. Start command: `node index.js`
7. Add environment variable (optional):
   - `PORT`: `3001` (or leave default)

### 🌐 Frontend (Vercel)
1. Go to https://vercel.com
2. Create a new project
3. Connect GitHub repo
4. Root directory: `/client`
5. Framework: React
6. Add environment variable:
   ```env
   VITE_SOCKET_SERVER_URL=https://your-render-app.onrender.com
