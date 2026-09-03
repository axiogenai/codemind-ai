# 🚀 How to Make CodeMind AI Live (Production Deployment Guide)

This guide covers 3 ways to deploy and host CodeMind AI on the public internet:

---

## ⚡ Option 1: Instant Public URL Access (Zero Configuration - 1 Minute)
If you want an immediate public HTTPS URL to share with users or investors directly from your current machine:

### Using Cloudflare Tunnel (Free & Secure)
1. Download Cloudflare Tunnel (`cloudflared`):
   - [https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/)
2. Run in terminal:
   ```bash
   cloudflared tunnel --url http://localhost:5174
   ```
3. Cloudflare will give you an instant public HTTPS URL (e.g. `https://random-subdomain.trycloudflare.com`) pointing directly to your live CodeMind AI application!

---

## 🌐 Option 2: Deploy Free Cloud Services (Vercel + Render)

### A. Deploy Frontend to Vercel (Free)
1. Push your project to GitHub.
2. Go to [Vercel.com](https://vercel.com) and click **Add New Project** $\rightarrow$ Select your GitHub repo.
3. Set **Root Directory**: `frontend`.
4. Set **Build Command**: `npm run build`.
5. Set **Output Directory**: `dist`.
6. Click **Deploy**. Vercel will give you a live production URL like `https://codemind-ai.vercel.app`.

### B. Deploy Backend to Render (Free)
1. Go to [Render.com](https://render.com) and create a **Web Service**.
2. Select your GitHub repository.
3. Set **Root Directory**: `backend`.
4. Set **Runtime**: `Python 3`.
5. Set **Build Command**: `pip install -r requirements.txt`.
6. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
7. Add Environment Variable:
   - `GROQ_API_KEY`: `<YOUR_GROQ_API_KEY>`
8. Click **Create Web Service**. Render will deploy your FastAPI engine to a public endpoint like `https://codemind-api.onrender.com`.

---

## 🐳 Option 3: Docker VPS Deployment (AWS / DigitalOcean / GCP / Linode)

If you have a Linux Cloud Virtual Private Server (VPS):

1. SSH into your server:
   ```bash
   ssh root@your-server-ip
   ```
2. Clone your repository:
   ```bash
   git clone https://github.com/your-username/codemind-ai.git
   cd codemind-ai
   ```
3. Run Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
4. CodeMind AI will be live on port `80` (HTTP) and `8000` (API) on your server's public IP!
