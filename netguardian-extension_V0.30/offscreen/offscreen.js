// offscreen/offscreen.js
//
// Runs inside the offscreen document (see offscreen.html). This is where the actual
// fetch + model inference happens now — not in the content script, and not in a
// worker spawned by the content script — specifically to avoid host-page CSPs that
// block chrome-extension:// worker scripts (e.g. Google Search does this).

const UNSAFE_CLASSES = new Set(["Porn", "Hentai", "Sexy"]);
const MODEL_URL = chrome.runtime.getURL("content/model/model.json");

let modelPromise = null;
function loadModel() {
  if (!modelPromise) {
    // Pass an explicit local URL. nsfwjs.load() with NO argument fetches its default
    // model from a remote host at runtime — which both breaks on any network hiccup
    // (this was the actual cause of the "Could not load the model..." error) and
    // silently contradicts the "on-device, nothing leaves your machine" design goal.
    // model.json + its .bin weight shard are bundled under content/model/ and loaded
    // from the extension's own origin, so this never touches the network.
    modelPromise = self.nsfwjs.load(MODEL_URL).catch((err) => {
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "ng-run-classification") return false;
  runClassification(msg.url, msg.threshold)
    .then(sendResponse)
    .catch((err) => sendResponse({ unsafe: false, score: 0, error: String((err && err.message) || err) }));
  return true; // async response
});

async function runClassification(url, threshold = 0.7) {
  const fetched = await fetchImageBytes(url);
  if (!fetched.ok) {
    return { unsafe: false, score: 0, error: fetched.error };
  }

  const model = await loadModel();
  const blob = new Blob([fetched.buffer]);
  const bitmap = await createImageBitmap(blob, {
    resizeWidth: 224,
    resizeHeight: 224,
    resizeQuality: "medium",
  });

  let predictions;
  try {
    predictions = await model.classify(bitmap);
  } finally {
    bitmap.close?.();
  }

  let unsafe = false;
  let maxProb = 0;
  let maxClass = null;
  for (const p of predictions) {
    if (p.probability > maxProb) {
      maxProb = p.probability;
      maxClass = p.className;
    }
    if (UNSAFE_CLASSES.has(p.className) && p.probability >= threshold) {
      unsafe = true;
    }
  }

  return { unsafe, score: maxProb, label: maxClass };
}

async function fetchImageBytes(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "unparseable-url" };
  }

  // http/https need the abort-timeout treatment since they're real network calls.
  // data: URLs carry their full payload in the string itself — fetch() resolves them
  // instantly with no network I/O — so they're safe to allow through too and skipping
  // them was an unnecessary coverage gap (a page could otherwise dodge classification
  // just by inlining an image as base64). file:/chrome-extension:/blob:/etc. stay
  // blocked: blob: URLs are scoped to the page's own origin and can't be dereferenced
  // from here anyway, and the others have no legitimate reason to appear as an <img> src.
  const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
  const isData = parsed.protocol === "data:";
  if (!isHttp && !isData) {
    return { ok: false, error: "unsupported-protocol" };
  }

  const controller = new AbortController();
  const timeout = isHttp ? setTimeout(() => controller.abort(), 8000) : null;
  try {
    // Offscreen documents share the extension's host_permissions, so this fetch is
    // not subject to the origin page's CORS policy — that's what makes cross-origin
    // image scanning possible at all.
    const res = await fetch(parsed.href, { signal: controller.signal, credentials: "omit" });
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    const contentType = res.headers.get("content-type") || "";
    if (contentType && !contentType.startsWith("image/")) {
      return { ok: false, error: "not-an-image" };
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 15 * 1024 * 1024) {
      return { ok: false, error: "image-too-large" };
    }
    return { ok: true, buffer };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
