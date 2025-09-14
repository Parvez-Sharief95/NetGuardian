<p align="center">
    <img src="https://img.icons8.com/color/96/000000/security-checked.png" alt="NetGuardian Logo" width="96"/>
</p>

<h1 align="center">🛡️ NETGUARDIAN — Browser Extension (MVP) 🤖</h1>

<p align="center">
    <img src="https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif" alt="AI Security Animation" width="320"/>
</p>

<p align="center">
    <b>Protect your browsing experience with AI-powered image filtering.<br>
    Safe. Secure. Seamless.</b>
</p>

---

## 🚀 Features

- **AI-Powered Image Blurring**  
    Automatically detects and blurs inappropriate images while you browse.
- **Real-Time Protection**  
    Keeps your web experience safe and family-friendly.
- **Easy to Use**  
    Simple setup with Chrome's extension system.
- **Customizable Settings**  
    Control your protection level from the extension popup.

---

## 🛠️ Getting Started

### 🧰 Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended) ⚙️
- [npm](https://www.npmjs.com/) (comes with Node.js) 📦
- [Google Chrome](https://www.google.com/chrome/) or Chromium-based browser 🌐

### 🚦 Setup Instructions

1. **Clone the repository**  
   ```bash
   git clone https://github.com/your-username/netguardian-extension.git
   cd netguardian-extension/client-extension
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Build the extension**  
   ```bash
   npm run build
   ```

4. **Load the extension in Chrome**  
   - Open <kbd>chrome://extensions</kbd> in your browser.
   - Enable <kbd>Developer mode</kbd> (top right).
   - Click <kbd>Load unpacked</kbd> and select the `client-extension/dist/` folder.
   - 🎉 **Browse safely!** The extension will automatically blur images on web pages.

<p align="center">
    <img src="https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif" alt="Browsing Safe" width="320"/>
</p>

---

## 📦 Required Modules & Libraries

- **React** ⚛️ — UI framework for the extension popup/options.
- **Chrome Extensions API** 🧩 — For browser integration.
- **TensorFlow.js** 🤖 (optional, for advanced AI) — Image classification.
- **NSFW.js** 🚫 (optional) — Detects inappropriate images.
- **styled-components** 🎨 — Styling React components.
- **@craco/craco** 🛠️ — Customizes Create React App configuration.

Install all dependencies with:
```bash
npm install
```

---

## 🤖 How It Works

<p align="center">
    <img src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif" alt="AI Robot" width="220"/>
</p>

- 🖼️ **Image Detection:**  
  Every image loaded in your browser is scanned by a smart heuristic worker (with optional AI upgrades).
- 🤖 **AI Filtering:**  
  The worker checks if images are inappropriate using lightweight rules or advanced AI models (TensorFlow.js/NSFW.js).
- 🔒 **Blurring:**  
  Detected images are instantly blurred, keeping your browsing safe and private.
- ⚙️ **Custom Settings:**  
  All preferences are securely stored in Chrome and can be managed from the extension popup.

---

## 🧩 Roadmap

- [ ] Integrate advanced AI models for better detection.
- [ ] Add user feedback and reporting.
- [ ] Support for more browsers.

---
git push origin main -f
<p align="center">
    <img src="https://img.icons8.com/fluency/96/000000/robot-2.png" alt="Robot" width="64"/>
    <br>
    <b>Stay safe, browse smart — with NetGuardian!</b>
</p>
