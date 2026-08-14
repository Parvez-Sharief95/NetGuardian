<!-- NETGUARDIAN README — Rewritten with clarity, creativity, and depth -->

<p align="center">
  <img src="https://raw.githubusercontent.com/dandetejaswini/Net-Gaurdian/main/client-extension/public/icons/icon128.png" alt="NetGuardian Logo" width="100"/>
</p>

<h1 align="center">
  🛡️ N E T G U A R D I A N
</h1>

<p align="center">
  <em>Your browser. Your rules. Your shield.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/built%20with-TypeScript-3178C6?style=flat-square&logo=typescript"/>
  <img src="https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi"/>
  <img src="https://img.shields.io/badge/AI-TensorFlow.js-FF6F00?style=flat-square&logo=tensorflow"/>
  <img src="https://img.shields.io/badge/dashboard-React%20+%20Vite-61DAFB?style=flat-square&logo=react"/>
  <img src="https://img.shields.io/badge/container-Docker-2496ED?style=flat-square&logo=docker"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square"/>
</p>

<!-- <p align="center">
  <a href="https://drive.google.com/file/d/1W-HeGaQFtOIbDmhmRwIAaKdflTTK4NNJ/view?usp=sharing" target="_blank">
    <img src="https://img.shields.io/badge/▶%20Watch%20Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo"/>
  </a>
</p> -->

---

## 🌐 The Story

> Imagine handing your child a smartphone connected to the entire internet — unfiltered, raw, and unpredictable.

**NetGuardian** was born from a simple but powerful idea: *what if your browser could think for itself?*

It's not just an extension. It's a **three-layer digital immune system** — a Chrome extension that silently watches every image, video, and iframe as you browse; a FastAPI backend that classifies content, detects deepfakes, and generates AI-powered insights; and a React dashboard that gives parents full visibility and control over what their children see online.

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        NETGUARDIAN ECOSYSTEM                    │
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │  Chrome Extension │      │  Parent Dashboard │                │
│  │  (TypeScript)     │      │  (React + Vite)   │                │
│  │                  │      │                  │                 │
│  │  • background.ts  │      │  • Dashboard Page │                │
│  │  • content/scan   │      │  • Reports Page   │                │
│  │  • popup UI       │◄────►│  • Settings Page  │                │
│  │  • TF.js NSFW     │      │  • Admin Panel    │                │
│  │  • MutationObsvr  │      │  • Chart.js viz   │                │
│  └────────┬─────────┘      └────────┬─────────┘                │
│           │                         │                           │
│           └──────────┬──────────────┘                           │
│                      ▼                                           │
│           ┌──────────────────┐                                   │
│           │   FastAPI Server  │  (Python 3.12 · Docker)          │
│           │                  │                                   │
│           │  /classify       │ ← Text safety scoring             │
│           │  /deepfake/check │ ← Image deepfake detection        │
│           │  /reports        │ ← Activity log (SQLAlchemy)       │
│           │  /ai/summary     │ ← OpenAI GPT-3.5 insights         │
│           │  /admin/users    │ ← User management (JWT auth)      │
│           │                  │                                   │
│           │  SQLite / PG DB  │                                   │
│           └──────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features That Actually Matter

### 🔴 For Children — Zero Tolerance Mode
| What happens | How it works |
|---|---|
| Inappropriate images vanish | `src` is cleared, `srcset` stripped — element gone |
| Videos are blocked at the protocol level | `HTMLMediaElement.prototype.play` is overridden globally |
| Suspicious iframes are removed from the DOM | Pattern-matched against known NSFW domains |
| NSFW score threshold: **40%** | Lower bar = higher protection |

### 🟡 For Adults — Smart Blur Mode
| What happens | How it works |
|---|---|
| Sensitive images get blurred instantly | `filter: blur(18px)` with smooth CSS transition |
| Videos get a blurred overlay | Non-destructive — content preserved |
| Iframes get a warning overlay | URL pattern matched against 8 risky keywords |
| NSFW score threshold: **85%** | Higher bar = less false positives |

### 🧠 AI Engine
- **TensorFlow.js** runs the NSFW detection model *in-browser* — no image data leaves your machine
- **OpenAI GPT-3.5** generates human-readable summaries and AI insights via the backend
- **Deepfake Detection** endpoint ready for integration with real ML models

### 📊 Parent Dashboard
- Real-time activity reports with Chart.js visualizations
- Total flagged content counts, unsafe action history
- AI-generated insights summarizing browsing patterns
- Role-switching between Parent and Child mode — live, from the popup

---

## 🗂️ Project Structure

```
Net-Guardian/
│
├── 📁 client-extension/          # Chrome Extension (TypeScript + Webpack)
│   ├── src/
│   │   ├── background/           # Service worker — role toggling via chrome.storage
│   │   ├── content/
│   │   │   ├── scan.ts           # 🔥 Core scanning engine (MutationObserver + TF.js)
│   │   │   └── uiOverlay.tsx     # Overlay UI injected into web pages
│   │   ├── popup/                # Extension popup (React)
│   │   ├── options/              # Extension options page
│   │   ├── models/               # TensorFlow.js NSFW model stub
│   │   └── utils/                # chrome.storage helpers
│   └── webpack.config.js
│
├── 📁 dashboard/                 # Parent Dashboard (React + Vite + Tailwind)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── dashboard.tsx     # Summary cards — Reports, Unsafe Actions, AI Insights
│   │   │   ├── reports.tsx       # Tabular activity log
│   │   │   ├── settings.tsx      # AI key config + notification prefs
│   │   │   └── admin.tsx         # User management panel
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── ActivityChart.tsx # Chart.js powered visualizations
│   │   │   ├── ReportsTable.tsx  # Filterable reports grid
│   │   │   └── SummaryCard.tsx   # KPI metric cards
│   │   └── hooks/useFetch.ts     # Generic data-fetching hook
│   └── vite.config.ts
│
└── 📁 server/                    # FastAPI Backend (Python 3.12 · Docker)
    ├── app/
    │   ├── main.py               # App factory, CORS, router registration
    │   ├── auth.py               # JWT (HS256) + bcrypt password hashing
    │   ├── db.py                 # SQLAlchemy ORM — SQLite default, PG-ready
    │   ├── models/               # User & Activity ORM models
    │   └── api/
    │       ├── classify.py       # POST /classify — text safety label
    │       ├── deepfake.py       # POST /deepfake/check — file upload check
    │       ├── reports.py        # GET  /reports — paginated activity log
    │       ├── openai_summary.py # POST /ai/summary — GPT-3.5 insights
    │       └── admin.py          # GET  /admin/users — admin user list
    ├── Dockerfile                # Python 3.12-slim, port 8000
    └── requirements.txt
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | v16+ | Extension & Dashboard builds |
| Python | 3.10+ | FastAPI backend |
| Google Chrome | Latest | Extension host |
| Docker *(optional)* | Any | Containerized server |

---

### ⚡ Option A — Run Everything Locally

#### 1. Clone the repo
```bash
git clone https://github.com/dandetejaswini/Net-Gaurdian.git
cd Net-Gaurdian
```

#### 2. Build & load the Chrome Extension
```bash
cd client-extension
npm install
npm run build
```
Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked** → select `client-extension/dist/`
4. Done. The guardian is active. 🛡️

#### 3. Start the Backend Server
```bash
cd ../server

# Create your environment file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY and SECRET_KEY

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API docs available at: `http://localhost:8000/docs`

#### 4. Launch the Parent Dashboard
```bash
cd ../dashboard
npm install
npm run dev
```
Dashboard available at: `http://localhost:5173`

---

### 🐳 Option B — Docker (Server Only)

```bash
cd server
docker build -t netguardian-server .
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your_key_here \
  -e SECRET_KEY=your_secret_here \
  netguardian-server
```

---

## ⚙️ Environment Variables

Create `server/.env` from `.env.example`:

```env
DATABASE_URL=sqlite:///./test.db     # Or your PostgreSQL URL
SECRET_KEY=your_super_secret_key     # JWT signing secret
OPENAI_API_KEY=sk-...                # Your OpenAI API key
```

---

## 🔬 How the Scanner Works — Under the Hood

```
Page loads in Chrome
       │
       ▼
scan.ts initializes (content script)
       │
       ├── Queries all <img>, <video>, [role="img"], <iframe>
       │
       ├── For each <img>:
       │     └── runTfjsNsfwModel(el) → NSFW score [0.0–1.0]
       │           ├── score > 0.85 (adult mode) → blur(18px) + overlay
       │           └── score > 0.40 (child mode)  → clear src + blur
       │
       ├── For each <video>:
       │     ├── adult mode → blur(18px) overlay
       │     └── child mode → pause + remove src + replace with block message
       │
       ├── For each <iframe>:
       │     └── URL matched against ["porn","nsfw","xxx","adult","sex","hentai","cams","nude"]
       │           ├── adult mode → blur overlay
       │           └── child mode → iframe removed from DOM entirely
       │
       ├── MutationObserver watches for dynamic DOM additions
       ├── popstate / hashchange events trigger re-scan (SPA support)
       └── setInterval(rescanDynamicContent, 3000) — safety net
```

**Child Mode Override:**
```typescript
// Global override — no video plays in child mode, period.
HTMLMediaElement.prototype.play = function (...args) {
  this.pause();
  this.src = "";
  // Replace element with "Blocked by NetGuardian" message
  return Promise.reject("Blocked by NetGuardian");
};
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Extension Core** | TypeScript + Webpack 5 | Browser extension logic |
| **In-Browser AI** | TensorFlow.js 4.x | Client-side NSFW scoring |
| **UI Framework** | React 18 | Popup, options, overlays |
| **Dashboard** | React + Vite + TailwindCSS | Parent control panel |
| **Data Viz** | Chart.js + react-chartjs-2 | Activity analytics |
| **Backend API** | FastAPI + Uvicorn | REST API server |
| **Auth** | JWT (HS256) + bcrypt | Secure session management |
| **ORM** | SQLAlchemy | Database abstraction |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Activity & user storage |
| **AI Insights** | OpenAI GPT-3.5-turbo | Natural language summaries |
| **Containerization** | Docker (Python 3.12-slim) | Portable deployment |

---

## 🗺️ Roadmap

- [x] Real-time image NSFW detection with TensorFlow.js
- [x] Child / Adult dual-mode protection levels
- [x] Dynamic DOM scanning with MutationObserver
- [x] SPA-aware re-scanning (popstate, hashchange, setInterval)
- [x] FastAPI backend with classify, deepfake, reports, and AI endpoints
- [x] JWT + bcrypt authentication system
- [x] Parent dashboard with reports and activity charts
- [ ] Integrate a trained deepfake detection model (replace stub)
- [ ] Add user feedback & manual reporting from popup
- [ ] Firefox and Edge browser support
- [ ] Cloud deployment guide (Railway / Render / AWS)
- [ ] Push notifications for parents (unsafe activity alerts)
- [ ] Allowlist / Blocklist management for custom domains

---

## 🤝 Contributing

Contributions are what make open source great. Here's how to get involved:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feat/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feat/amazing-feature`
5. **Open a Pull Request** — we'll review it within 48 hours

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <sub>Built with 💙 by <a href="https://github.com/Parvez-Sharief95">ParvezSharief</a> and contributors</sub><br/>
  <sub>⭐ Star this repo if NetGuardian made the web a little safer for someone you love.</sub>
</p>
