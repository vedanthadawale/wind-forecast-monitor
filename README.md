# UK Wind Forecast Monitor

A full-stack web application for monitoring UK national wind power generation forecasts against actual generation. Built as part of the REint Full Stack SWE challenge.

> **AI Tools Disclosure**: This project was built with Claude (Anthropic) as an AI coding assistant, as permitted by the challenge requirements. All analytical reasoning in the notebooks was done independently.

## 🔗 Links

- **Live App**: https://wind-forecast-monitor-nine.vercel.app

---

## 📁 Project Structure

```
wind-forecast-monitor/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, meta)
│   ├── page.tsx                  # Main application page
│   ├── globals.css               # Global styles & CSS variables
│   └── api/
│       ├── actual/route.ts       # Proxy → Elexon FUELHH (actual wind generation)
│       └── forecast/route.ts     # Proxy → Elexon WINDFOR (wind forecasts)
│
├── components/
│   ├── ForecastChart.tsx         # Recharts line chart (actual vs forecast)
│   └── StatsCards.tsx            # MAE / MBE / RMSE / NMAE metric cards
│
├── lib/
│   └── dataUtils.ts              # Data processing: pairing actuals & forecasts
│
├── notebooks/
│   ├── 01_forecast_error_analysis.ipynb    # Analysis 1: error characteristics
│   ├── 02_wind_reliability_analysis.ipynb  # Analysis 2: reliability recommendation
│   └── requirements.txt                    # Python dependencies
│
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 How to Start the Application

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts — it auto-detects Next.js.
# Set framework to Next.js, no env vars required.
```

---

## 📊 How the App Works

1. **Select a date range** within January 2024 using the datetime pickers.
2. **Adjust the forecast horizon** slider (0–48 hours, default 4h).
3. Click **Load Data** — the app fetches actual (FUELHH) and forecast (WINDFOR) data from Elexon BMRS via server-side API proxies.
4. For each target time T, the app finds the **latest forecast published at or before T − horizon** hours and plots it as the green dashed line.
5. **Error metrics** (MAE, NMAE, RMSE, MBE) are computed and displayed above the chart.

### Data Sources
| Dataset | Endpoint | Description |
|---------|----------|-------------|
| Actual | `FUELHH/stream` | Half-hourly fuel mix — `fuelType = WIND` |
| Forecast | `WINDFOR/stream` | Wind power forecasts — `startTime`, `publishTime`, `generation` |

---

## 📓 Running the Notebooks

```bash
cd notebooks
pip install -r requirements.txt
jupyter lab
```

Open and run cells in order:
1. `01_forecast_error_analysis.ipynb` — MAE, RMSE, P99, error vs horizon, error by time of day
2. `02_wind_reliability_analysis.ipynb` — Duration curve, percentiles, firm capacity recommendation

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| Charts | Recharts |
| API | Elexon BMRS (proxied via Next.js API routes) |
| Analysis | Python, pandas, numpy, matplotlib, scipy |
| Deployment | Vercel |
