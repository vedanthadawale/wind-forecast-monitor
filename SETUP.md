# 🚀 Deployment & Submission Guide

Complete step-by-step instructions to deploy and submit the challenge.

---

## Step 1 — Local Setup

```bash
cd wind-forecast-monitor
npm install
npm run dev
# → Open http://localhost:3000
# → Pick any date range within January 2024, click "Load Data"
```

---

## Step 2 — Deploy to Vercel

### Option A: CLI (fastest)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Inside the project folder:
vercel

# When prompted:
#   Set up and deploy? → Y
#   Which scope? → your account
#   Link to existing project? → N
#   Project name? → wind-forecast-monitor (or anything)
#   Which directory? → ./ (just press Enter)
#   Override settings? → N

# First deploy → preview URL
# Run again for production:
vercel --prod
# → Copy the production URL, e.g. https://wind-forecast-monitor.vercel.app
```

### Option B: GitHub → Vercel dashboard
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial submission"
git remote add origin https://github.com/YOUR_USERNAME/wind-forecast-monitor.git
git push -u origin main

# Then go to vercel.com → Import Project → pick the repo → Deploy
```

---

## Step 3 — Run the Jupyter Notebooks

```bash
cd notebooks
pip install -r requirements.txt
jupyter lab

# Run all cells in order:
#   01_forecast_error_analysis.ipynb
#   02_wind_reliability_analysis.ipynb
# Both notebooks fetch data live from the Elexon API.
# Outputs (charts as .png files) will be saved in the notebooks/ folder.
```

---

## Step 4 — Create Git Repo & Zip

```bash
cd wind-forecast-monitor

git init
git add .
git commit -m "REint Full Stack SWE challenge submission"

# Push to GitHub (create a new repo at github.com first)
git remote add origin https://github.com/YOUR_USERNAME/wind-forecast-monitor.git
git push -u origin main

# Create zip archive
cd ..
zip -r wind-forecast-monitor.zip wind-forecast-monitor/ --exclude "*/node_modules/*" --exclude "*/.next/*"

# Upload wind-forecast-monitor.zip to Google Drive
# Set sharing → "Anyone with the link can view"
# Copy the shareable link
```

---

## Step 5 — Record Demo Video (≤5 min)

Suggested structure:
1. **(0:00–0:30)** — Intro: what you built, the problem statement
2. **(0:30–2:00)** — Live demo of the app:
   - Select Jan 15–16 2024, 4h horizon → Load
   - Point out actual (blue) vs forecast (green dashed)
   - Change horizon to 24h → show error increases
   - Point out MAE/NMAE/RMSE/MBE cards
   - Show mobile view (resize browser)
3. **(2:00–3:30)** — Walk through Notebook 1 (error analysis charts)
4. **(3:30–4:30)** — Walk through Notebook 2 (reliability recommendation, P10 reasoning)
5. **(4:30–5:00)** — Wrap up

Upload to YouTube as **Unlisted**.

---

## Step 6 — Send Submission Email

```
To: hiring@reint.ai
Subject: Full Stack SWE challenge submission

Demo video link: https://youtu.be/YOUR_VIDEO_ID
App demo link: https://wind-forecast-monitor.vercel.app
Repo link: https://drive.google.com/YOUR_ZIP_LINK
Name: [Your Name]
Wellfound URL: [Your Wellfound profile]
Linkedin URL: [Your LinkedIn]
Resume: [Google Drive link]
Phone no.: [Your number]
```

---

## Notes

- Data is scoped to **January 2024** only (per challenge spec).
- Date range picker is limited to Jan 1–31 2024.
- For performance, the UI limits requests to 7-day windows at a time.
- The Elexon BMRS API is public and requires no authentication.
