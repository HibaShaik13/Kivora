# Kivora — Production Deployment Guide

This guide provides step-by-step instructions to deploy the complete Kivora application to **Vercel** (Frontend) and **Render** (FastAPI Backend + Managed PostgreSQL Database).

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + Vite)               │
│               Hosted on Vercel Edge CDN                │
│            https://your-kivora-app.vercel.app          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (Bearer JWT)
                            ▼
┌────────────────────────────────────────────────────────┐
│               Backend (FastAPI + Uvicorn)              │
│               Hosted on Render Web Service             │
│            https://kivora-api.onrender.com             │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌──────────────────────────┐ ┌───────────────────────────┐
│ Managed PostgreSQL (SQL) │ │ Persistent Cloud Storage  │
│ Render / Neon / Supabase │ │ Render Disk / Cloudinary  │
└──────────────────────────┘ └───────────────────────────┘
```

---

## 1. Prerequisites

Before beginning deployment, ensure you have:
1. A **GitHub** account to host the repository.
2. A **Render** account ([render.com](https://render.com)) for backend and database hosting.
3. A **Vercel** account ([vercel.com](https://vercel.com)) for frontend hosting.
4. An **SMTP Sender** (e.g. Gmail with a 16-character Google App Password) for email verification delivery.
5. *(Optional)* A **Google Gemini API Key** ([aistudio.google.com](https://aistudio.google.com)) for AI brief building and creator claim verification.

---

## 2. Step-by-Step Deployment Instructions

### Step 1 — Push Code to Your GitHub Repository

Initialize and push the repository to your private or public GitHub repository:

```bash
git add .
git commit -m "feat: complete Kivora production-ready application"
git remote add origin https://github.com/YOUR_USERNAME/Kivora.git
git branch -M main
git push -u origin main
```

*(Note: `.env`, `*.db`, `uploads/`, `node_modules/`, and temporary scratch files are already excluded by `.gitignore`.)*

---

### Step 2 — Deploy Managed PostgreSQL Database on Render

1. Go to the [Render Dashboard](https://dashboard.render.com/) $\to$ **New +** $\to$ **PostgreSQL**.
2. **Name:** `kivora-postgres`
3. **Database:** `kivoradb`
4. **User:** `kivora_user`
5. **Region:** Choose the region closest to your users (e.g., `Oregon (US West)` or `Frankfurt (EU)`).
6. **Plan:** Free or Starter.
7. Click **Create Database**.
8. Once provisioned, copy the **Internal Database URL** (or **External Database URL**).

---

### Step 3 — Deploy FastAPI Backend on Render

1. In Render Dashboard, click **New +** $\to$ **Web Service**.
2. Connect your GitHub repository: `YOUR_USERNAME/Kivora`.
3. Configure the service:
   - **Name:** `kivora-api`
   - **Region:** Same region as your database.
   - **Branch:** `main` (or `master`)
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/health`

4. Add **Environment Variables** in Render:

| Variable Name | Example / Format | Description |
| :--- | :--- | :--- |
| `KIVORA_ENV` | `production` | Enables production security & suppresses dev OTPs |
| `SECRET_KEY` | `generate-random-64-char-string` | Cryptographic secret for signing PyJWT access tokens |
| `DATABASE_URL` | `postgresql://user:pass@host/kivoradb` | Connection string from Step 2 |
| `KIVORA_CORS_ORIGINS` | `https://your-kivora-app.vercel.app` | Comma-separated list of allowed frontend domains |
| `KIVORA_UPLOAD_DIR` | `uploads` *(or `/var/data/uploads` if disk attached)* | Storage path for uploads |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP host |
| `SMTP_PORT` | `587` | SMTP port (STARTTLS) |
| `SMTP_USERNAME` | `your_email@gmail.com` | Email account username |
| `SMTP_PASSWORD` | `your_google_app_password` | 16-character Google App Password |
| `SMTP_FROM_EMAIL` | `your_email@gmail.com` | From address |
| `SMTP_FROM_NAME` | `Kivora Platform` | From display name |
| `SMTP_USE_TLS` | `true` | STARTTLS enabled |
| `GEMINI_API_KEY` | `your_gemini_api_key` | *(Optional)* Google Gemini AI API Key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |

5. Click **Create Web Service**.
6. Wait for the build to finish. Once live, note your backend URL (e.g. `https://kivora-api.onrender.com`).
7. Test the health endpoint by visiting: `https://kivora-api.onrender.com/api/health` $\to$ should return `{"status": "healthy", "database": "connected"}`.

---

### Step 4 — Deploy React Frontend on Vercel

1. Go to the [Vercel Dashboard](https://vercel.com/new).
2. Click **Import Project** and select your `Kivora` GitHub repository.
3. In project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add **Environment Variables** in Vercel:

| Variable Name | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://kivora-api.onrender.com` *(your live Render backend URL from Step 3)* |
| `VITE_APP_NAME` | `Kivora` |

5. Click **Deploy**.
6. Vercel will build and assign your production domain (e.g. `https://your-kivora-app.vercel.app`).

---

### Step 5 — Update CORS Origins on Backend

1. Return to your Render Web Service $\to$ **Environment**.
2. Update `KIVORA_CORS_ORIGINS` with your assigned Vercel URL:
   ```
   KIVORA_CORS_ORIGINS=https://your-kivora-app.vercel.app
   ```
3. Save changes. Render will automatically perform a zero-downtime redeploy.

---

## 3. Persistent Media Storage Configuration

For persistent file storage in production, you have two reliable options:

### Option A: Render Persistent Disk (Simplest)
1. On your Render Web Service $\to$ **Disks** $\to$ **Add Disk**.
2. **Name:** `kivora-media-disk`
3. **Mount Path:** `/var/data/uploads`
4. **Size:** 10 GB (Starter plan).
5. Set `KIVORA_UPLOAD_DIR=/var/data/uploads` in your Web Service environment variables.

### Option B: Cloud Object Storage (Cloudinary / AWS S3 / Cloudflare R2)
- Configure an S3-compatible bucket or Cloudinary account and set credentials in backend environment variables.

---

## 4. Post-Deployment Verification Checklist

- [ ] **Health Check:** `GET /api/health` returns `{"status": "healthy", "database": "connected", "environment": "production"}`.
- [ ] **Email Verification:** Register a new Creator account $\to$ receive real 6-digit OTP email $\to$ verify successfully.
- [ ] **Profile Setup:** Complete Onboarding and upload portfolio assets.
- [ ] **Campaign Matching:** Publish a brief and verify explainable match scores compute properly.
- [ ] **Deliverable Workflow:** Submit deliverable $\to$ request revision $\to$ approve $\to$ complete review.
- [ ] **Security Validation:** Verify that public registration as `ADMIN` is rejected with `400 Bad Request`, and development OTP hints are hidden in production responses.
