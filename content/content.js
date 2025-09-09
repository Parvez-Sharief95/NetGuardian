// content/content.js
// Inject a small stylesheet for blur class
const STYLE_ID = 'netguardian-styles';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .ng-blur { filter: blur(14px) !important; transition: filter .2s ease-in-out; }
    .ng-flag { outline: 3px solid rgba(255,0,0,0.5) !important; }
    .ng-toggle { position: absolute; z-index: 2147483647; }
  `;
  document.head.appendChild(style);
}

// Settings default
const defaultSettings = { enabled: true, role: 'Adult', threshold: 0.7 };

// State
let settings = defaultSettings;

// Load settings from storage
chrome.storage.local.get(['netguardian_settings'], (res) => {
  if (res.netguardian_settings) settings = { ...defaultSettings, ...res.netguardian_settings };
  if (settings.enabled) scanPage();
});

// Listen to storage changes (so popup/options updates take effect)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.netguardian_settings) {
    settings = { ...settings, ...changes.netguardian_settings.newValue };
    if (settings.enabled) scanPage();
    else removeAllBlurs();
  }
});

function removeAllBlurs() {
  document.querySelectorAll('img.ng-blur').forEach(img => img.classList.remove('ng-blur'));
}

// Debounced page scan
let scanTimeout = null;
function scanPage() {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(() => {
    const imgs = Array.from(document.images);
    imgs.forEach(analyzeImage);
  }, 500);
}

// Offload classification to a worker file
function analyzeImage(img) {
  // skip tiny images
  if (!img || img.naturalWidth < 80 || img.naturalHeight < 80) return;

  // Avoid reprocessing
  if (img.dataset.ngProcessed) return;
  img.dataset.ngProcessed = 'working';

  // create a tiny canvas thumbnail
  const canvas = document.createElement('canvas');
  const ratio = Math.min(128 / img.naturalWidth, 128 / img.naturalHeight, 1);
  canvas.width = Math.round(img.naturalWidth * ratio);
  canvas.height = Math.round(img.naturalHeight * ratio);
  const ctx = canvas.getContext('2d');

  try {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

    // Send to worker
    const worker = new Worker(chrome.runtime.getURL('content/nsfw-worker.js'));
    worker.postMessage({ image: dataUrl, threshold: settings.threshold, role: settings.role });
    worker.onmessage = (e) => {
      const { unsafe, score } = e.data;
      if (unsafe) {
        img.classList.add('ng-blur');
        img.dataset.ngReason = `score:${score}`;
        // add small overlay toggle (optional)
      }
      img.dataset.ngProcessed = 'done';
      worker.terminate();
    };
  } catch (err) {
    // cross-origin images may fail drawImage; mark as processed
    img.dataset.ngProcessed = 'done';
  }
}

// Run initial scan and also observe DOM changes
scanPage();
const observer = new MutationObserver(() => {
  scanPage();
});
observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
