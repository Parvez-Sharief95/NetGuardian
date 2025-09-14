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
  try {
    if (!img || img.dataset.ngProcessed) return;
    img.dataset.ngProcessed = 'working';
    console.log('[NG] analyzeImage start:', img.src);

    // If the image hasn't loaded yet (lazy-loading), wait for load
    if (!img.complete || img.naturalWidth === 0) {
      console.log('[NG] image not complete, attaching load listener:', img.src);
      img.addEventListener('load', () => {
        console.log('[NG] image loaded via event:', img.src);
        analyzeImage(img);
      }, { once: true });
      return;
    }

    // Skip tiny placeholders
    if (img.naturalWidth < 80 || img.naturalHeight < 80) {
      console.log('[NG] skipping tiny placeholder:', img.src, img.naturalWidth, img.naturalHeight);
      img.dataset.ngProcessed = 'done';
      return;
    }

    // Try to use crossOrigin and draw to canvas using an offscreen Image to be safer
    const offImg = new Image();
    offImg.crossOrigin = 'anonymous';
    offImg.src = img.src;

    offImg.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(128 / offImg.naturalWidth, 128 / offImg.naturalHeight, 1);
        canvas.width = Math.round(offImg.naturalWidth * ratio);
        canvas.height = Math.round(offImg.naturalHeight * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(offImg, 0, 0, canvas.width, canvas.height);

        let dataUrl = null;
        try {
          dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        } catch (err) {
          console.error('[NG] toDataURL failed (CORS issue)', err, img.src);
          // fallback: mark as done without blur
          img.dataset.ngProcessed = 'done';
          return;
        }


        // Create worker and send image
        console.log('[NG] sending to worker:', img.src);
        const worker = new Worker(chrome.runtime.getURL('content/nsfw-worker.js'));
        worker.postMessage({ image: dataUrl, threshold: settings.threshold, role: settings.role });
        worker.onmessage = (e) => {
          console.log('[NG] worker response for', img.src, e.data);
          const { unsafe, score, label } = e.data;
          if (unsafe) {
            img.classList.add('ng-blur');
            img.dataset.ngReason = `${label}:${score}`;
          }
          img.dataset.ngProcessed = 'done';
          worker.terminate();
        };
      } catch (err) {
        console.error('[NG] error in offImg.onload handler', err, img.src);
        img.dataset.ngProcessed = 'done';
      }
    };

    offImg.onerror = (err) => {
      console.error('[NG] offImg failed to load', img.src, err);
      img.dataset.ngProcessed = 'done';
    };
  } catch (err) {
    console.error('[NG] analyzeImage outer error', err, img && img.src);
    if (img) img.dataset.ngProcessed = 'done';
  }
}

// Run initial scan and also observe DOM changes
scanPage();
const observer = new MutationObserver(() => {
  scanPage();
});
observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
