// content/content.js
(() => {
  if (window.top !== window) return; // skip iframes/sandboxed embeds — top frame only

  const DEFAULT_SETTINGS = { enabled: true, role: "Adult", threshold: 0.7 };
  const ROLE_THRESHOLDS = { Minor: 0.4, Parent: 0.55, Adult: 0.7 };
  const MIN_DIMENSION = 80; // skip icons/spacers/tracking pixels
  const MAX_CONCURRENT_CLASSIFICATIONS = 4;

  let settings = { ...DEFAULT_SETTINGS };

  // ---------- 1. Styles ----------
  const STYLE_ID = "netguardian-styles";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      img.ng-blur { filter: blur(18px) !important; transition: filter .2s ease-in-out; }
      .ng-text-flag { filter: blur(4px); cursor: pointer; }
      .ng-text-flag:hover { filter: none; }
    `;
    document.head.appendChild(style);
  }

  // ---------- 2. Settings load + live updates ----------
  function applySettingsChange() {
    if (settings.enabled) {
      scanPage();
    } else {
      removeAllBlurs();
    }
  }

  try {
    chrome.storage.local.get(["netguardian_settings"], (res) => {
      if (res?.netguardian_settings) settings = { ...DEFAULT_SETTINGS, ...res.netguardian_settings };
      applySettingsChange();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes.netguardian_settings) return;
      settings = { ...DEFAULT_SETTINGS, ...changes.netguardian_settings.newValue };
      applySettingsChange();
    });
  } catch {
    applySettingsChange();
  }

  function effectiveThreshold() {
    return typeof settings.threshold === "number" ? settings.threshold : ROLE_THRESHOLDS[settings.role] ?? 0.7;
  }

  function removeAllBlurs() {
    document.querySelectorAll("img.ng-blur").forEach((img) => img.classList.remove("ng-blur"));
    document.querySelectorAll(".ng-text-flag").forEach((el) => el.classList.remove("ng-text-flag"));
  }

  // ---------- 3. Classification request (all fetch + inference happens off-page) ----------
  // Note: we deliberately never spawn a Worker or fetch image bytes here. Content
  // scripts inherit the *host page's* CSP — sites like Google Search set a
  // worker-src/connect-src policy that blocks chrome-extension:// resources, which
  // silently breaks any extension that tries to do the work in-page. Instead we just
  // hand the image URL to the background service worker, which relays it to an
  // offscreen document (an extension-owned page immune to the host page's CSP) to
  // fetch and classify.
  function classifyUrl(url, threshold) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "ng-classify-image", url, threshold }, (res) => {
          if (chrome.runtime.lastError) {
            resolve({ unsafe: false, score: 0, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(res || { unsafe: false, score: 0, error: "no-response" });
        });
      } catch (e) {
        resolve({ unsafe: false, score: 0, error: String(e) });
      }
    });
  }

  // ---------- 4. Concurrency-limited task queue ----------
  // Prevents a page with hundreds of images from firing hundreds of simultaneous
  // classification requests at once.
  const queue = [];
  let inFlight = 0;
  function enqueue(task) {
    queue.push(task);
    pump();
  }
  function pump() {
    while (inFlight < MAX_CONCURRENT_CLASSIFICATIONS && queue.length) {
      const task = queue.shift();
      inFlight++;
      task().finally(() => {
        inFlight--;
        pump();
      });
    }
  }

  // ---------- 5. Image scanning ----------
  function scanImages() {
    Array.from(document.images).forEach((img) => enqueue(() => classifyImage(img)));
  }

  async function classifyImage(img) {
    try {
      if (!(img instanceof HTMLImageElement)) return;
      const state = img.dataset.ngProcessed;
      if (state === "working" || state === "done") return;

      if (!img.complete || img.naturalWidth === 0) {
        img.dataset.ngProcessed = "pending";
        img.addEventListener(
          "load",
          () => {
            delete img.dataset.ngProcessed;
            enqueue(() => classifyImage(img));
          },
          { once: true }
        );
        return;
      }

      if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
        img.dataset.ngProcessed = "done";
        return;
      }

      img.dataset.ngProcessed = "working";
      const src = img.currentSrc || img.src;
      if (!src) { img.dataset.ngProcessed = "done"; return; }

      const { unsafe, score, label, error } = await classifyUrl(src, effectiveThreshold());

      if (error) {
        console.debug("[NetGuardian] skipped image:", error, src);
      }

      if (unsafe) {
        img.classList.add("ng-blur");
        img.dataset.ngReason = `${label ?? "unsafe"}:${score ?? 0}`;
      } else {
        img.classList.remove("ng-blur");
        delete img.dataset.ngReason;
      }
      img.dataset.ngProcessed = "done";
    } catch (e) {
      img.dataset.ngProcessed = "done";
    }
  }

  // ---------- 6. Lightweight text flagging ----------
  // Word-boundary matching against a small, conservative phrase list — this is a
  // fast heuristic pass, not a replacement for the ML image pipeline. It only walks
  // leaf-level text-bearing elements so it can't blur out entire page sections.
  const FLAGGED_TERMS = ["porn", "pornographic", "explicit content", "nsfw"];
  const FLAG_REGEX = new RegExp(`\\b(${FLAGGED_TERMS.map(escapeRegExp).join("|")})\\b`, "i");
  const TEXT_HOST_SELECTOR = "p, span, li, a, blockquote, h1, h2, h3, h4, h5, h6, td, dd, figcaption";
  const flaggedNodes = new WeakSet();

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function scanText() {
    const candidates = document.querySelectorAll(TEXT_HOST_SELECTOR);
    for (const el of candidates) {
      if (flaggedNodes.has(el)) continue;
      const text = el.textContent;
      if (text && text.length < 500 && FLAG_REGEX.test(text)) {
        el.classList.add("ng-text-flag");
        el.title = "Flagged by NetGuardian";
        flaggedNodes.add(el);
      }
    }
  }

  // ---------- 7. Debounced scan orchestration ----------
  let scanTimer = null;
  function scanPage() {
    if (!settings.enabled) return;
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanImages();
      scanText();
    }, 250);
  }

  // ---------- 8. Watch for dynamically added / lazily-swapped content ----------
  // Two things need watching, not just one:
  //   - childList/subtree: new <img> nodes inserted (infinite scroll, SPA nav)
  //   - attributes on src/srcset: many sites (Google Images included) load a tiny
  //     placeholder first, then swap in the real image URL on the SAME <img> element
  //     after the fact. Without watching attributes too, that element was already
  //     marked "done" (the placeholder failed the size check) and the real image
  //     never got (re)classified.
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const m of mutations) {
      if (m.type === "childList" && m.addedNodes.length > 0) {
        shouldScan = true;
      } else if (m.type === "attributes" && m.target instanceof HTMLImageElement) {
        delete m.target.dataset.ngProcessed; // force re-classification of the swapped src
        shouldScan = true;
      }
    }
    if (shouldScan) scanPage();
  });
  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "srcset"],
  });

  window.addEventListener("pagehide", () => observer.disconnect());

  scanPage();
})();
