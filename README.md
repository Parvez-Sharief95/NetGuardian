# NETGUARDIAN — Browser Extension (MVP)

How to load locally:
1. Open Chrome → Menu → More tools → Extensions.
2. Enable "Developer mode".
3. Click "Load unpacked" and select this `client-extension/` folder.
4. The extension will inject and blur images on pages.

Notes:
- Worker currently uses a naive heuristic. Replace with a proper TF.js or nsfwjs model.
- Settings stored in Chrome storage (popup/options).
