# SuDomus Deployment Guide

This guide details the complete production deployment procedure for SuDomus across **Neon** (Database), **Render** (Node.js/Express Backend), and **Vercel** (React/Vite Frontend).

---

## 1. System Architecture Overview

| Layer | Service / Tech | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) on **Vercel** | Client UI, marketplace, routing, AI floating widget |
| **Backend** | Node.js / Express on **Render** | REST API, JWT auth, Gemini AI orchestration |
| **Database** | PostgreSQL on **Neon** | Serverless relational data storage |
| **AI Engine** | Google Gemini | Property recommendation & conversational search |
| **Storage** | Cloudinary (Optional) / Base64 | Listing image uploads |

---

## 2. Step 1: Database Setup (Neon)

1. Log in to your [Neon Console](https://console.neon.tech/).
2. Create a new project named `sudomus-db`.
3. In the Neon Dashboard, locate your **Connection string**. Ensure it is formatted as:
   ```text
   postgresql://<username>:<password>@<ep-identifier>.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > **Note**: `sslmode=require` is required for secure cloud communication with Neon.
4. If setting up for the first time, run the admin migration against Neon from your local terminal:
   ```bash
   cd backend
   node migrate_admin.js
   ```

---

## 3. Step 2: Backend Deployment (Render)

### A. Create Web Service on Render
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository containing the SuDomus code.
4. Configure the service settings:
   - **Name**: `sudomus-api` (or preferred name)
   - **Region**: Choose the region closest to your users or database (e.g., `Ohio (US East)` or `Frankfurt`).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` or `Starter`

### B. Environment Variables on Render
Add the following in Render under **Environment**:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require` | Connection string to Neon PostgreSQL |
| `JWT_SECRET` | `replace_with_a_64_character_random_secret` | Secret key for signing & verifying JWTs |
| `FRONTEND_URL` | `https://your-sudomus-app.vercel.app` | Allowed frontend origin for CORS (no trailing slash) |
| `GEMINI_API_KEY` | `AQ.Ab8RN6LFxMR4WG...` | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-3.6-flash` | Gemini model name |
| `CLOUDINARY_CLOUD_NAME` | `(optional)` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `(optional)` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `(optional)` | Cloudinary API secret |

*(Note: Render automatically injects `PORT=10000`, which `backend/index.js` listens to via `process.env.PORT`)*.

### C. Verify Backend Deployment
Once deployed, open your Render URL (e.g. `https://sudomus-api.onrender.com/`).
You should see:
```json
{
  "status": "ok",
  "message": "SuDomus API is running"
}
```

---

## 4. Step 3: Frontend Deployment (Vercel)

### A. Import Project into Vercel
1. Log into your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Select your GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `my-react-app`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### B. Environment Variables on Vercel
In the **Environment Variables** section, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://sudomus-api.onrender.com/api` | Full URL to backend API (with `/api`, no trailing slash) |

> **Critical**: Do NOT put database credentials, JWT secrets, or private API keys in Vercel environment variables. Vite only exposes variables prefixed with `VITE_`.

### C. Single Page Application (SPA) Routing
A `vercel.json` file is already included in `my-react-app/`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures direct navigation and page reloads on routes like `/about`, `/properties`, `/dashboard`, and `/login` load correctly without 404 errors.

5. Click **Deploy**.

---

## 5. Step 4: Finalize CORS Configuration

Once Vercel assigns your production domain (e.g. `https://sudomus-client.vercel.app`):
1. Go to your **Render Dashboard** → **sudomus-api** → **Environment**.
2. Update `FRONTEND_URL` to match your exact Vercel domain:
   ```text
   FRONTEND_URL=https://sudomus-client.vercel.app
   ```
   *(If you also want local testing, you can provide comma-separated origins: `https://sudomus-client.vercel.app,http://localhost:5173`)*.
3. Save changes in Render to trigger a rapid restart.

---

## 6. Pre-flight Smoke Test Checklist

- [ ] **Health Check**: Visit `https://your-backend.onrender.com/` → confirms API is running.
- [ ] **DB Connectivity**: Visit `https://your-backend.onrender.com/api/db-test` → confirms Neon connection.
- [ ] **Frontend Loading**: Visit `https://your-frontend.vercel.app` → homepage and listings render cleanly.
- [ ] **Direct Route Refresh**: Navigate to `/about`, press refresh → page reloads without 404.
- [ ] **User Registration & Login**: Create a test account and sign in.
- [ ] **Profile Update**: Go to `/dashboard` → Profile tab → edit your name → verify persistence upon page reload.
- [ ] **AI Assistant**: Open the floating AI assistant widget → send a message ("Find 3 bedroom flats in Lekki") → verify property cards and responses.
