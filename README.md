# NetGuardian — Safe Browsing Extension

Blurs explicit images and flags harmful text in real time, entirely on-device.
Manifest V3, no build step, no external servers.

## Project structure

```
netguardian-extension/
├── manifest.json
├── background/
│   └── service-worker.js      # settings init + offscreen-document lifecycle/relay
├── offscreen/
│   ├── offscreen.html         # hidden extension page immune to any web page's CSP
│   └── offscreen.js           # fetches image bytes + runs the nsfwjs model
├── content/
│   ├── content.js             # scans the page, manages the classification queue
│   ├── libs/
│   │   ├── nsfwjs.min.js      # official self-contained UMD build (the inference engine)
│   │   └── nsfwjs.LICENSE.txt
│   └── model/
│       ├── model.json         # trained MobileNetV2 model topology (bundled, not fetched)
│       └── group1-shard1of1.bin  # trained weights (~2.6MB)
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

There is no `src/` vs `public/` split and no bundler — every file here is loaded by
Chrome exactly as written, so what you edit is what runs.

## How it works

1. `content.js` finds `<img>` elements at least 80×80px and sends their URL to the
   background service worker — it does **not** fetch bytes or spawn a worker itself.
2. The background worker lazily creates a hidden **offscreen document** (a
   Chrome-MV3 API for running extension-owned pages with no visible UI) and relays
   the request to it.
3. `offscreen.js` fetches the image directly. Because it runs as an extension page
   with `host_permissions`, this fetch is not subject to the origin site's CORS
   policy — which is what lets images from third-party CDNs be scanned at all.
4. `offscreen.js` also loads `nsfwjs`, pointed at the **bundled** `content/model/model.json`
   (not the network) — see "Model weights" below for why that distinction matters.
   Running this in the offscreen document — rather than a Worker created by the content
   script — matters: content scripts inherit the **host page's** CSP for things like
   `Worker()`, and sites like Google Search set a `worker-src` policy that silently
   blocks `chrome-extension://` workers. Offscreen documents are governed by the
   extension's own CSP instead, so this works on every site.
5. The background worker relays the `{unsafe, score, label}` result back to
   `content.js`, which applies `filter: blur(...)` to images above the active
   threshold. Threshold defaults to a per-role value (Minor/Parent/Adult) set in the
   popup, and can be fine-tuned on the Settings (options) page.
6. A lightweight, separate regex pass flags a small set of explicit terms in visible
   text (paragraphs, list items, headings) — independent of the image pipeline.
7. The offscreen document (and the loaded model) is automatically closed after 2
   minutes of no classification activity, via `chrome.alarms`, to free memory.

## Model weights

`nsfwjs.min.js` (the UMD build) bundles the *inference engine* — but **not** the
trained model weights. Calling `nsfwjs.load()` with no argument makes it fetch
those weights (a `model.json` + a binary shard) from a remote URL at runtime. That
was actually the root cause of a "Could not load the model..." error hit during
testing — a genuinely on-device, privacy-first extension shouldn't be doing that
fetch at all, network hiccups aside.

`content/model/model.json` and `content/model/group1-shard1of1.bin` are the actual
trained MobileNetV2 weights (sourced from the nsfwjs project's own repository,
same model the hosted demo uses), bundled directly into the extension. `offscreen.js`
passes their local `chrome-extension://` URL to `nsfwjs.load(...)` explicitly, so
model loading never touches the network — only per-image fetches (of the page's own
images, to classify them) do.

## A note on `data:` URLs and lazy-loaded thumbnails

Many sites (Google Images included) render each image as a small base64 `data:`
placeholder first, then swap in the real URL via JS once it's ready. Two things
handle this:

- The base64 payload is itself image data with no network dependency, so
  `offscreen.js` classifies `data:` URLs directly (no fetch involved) instead of
  skipping them — otherwise a page could dodge detection just by inlining images.
- When the placeholder gets swapped for a real URL, that's an attribute mutation
  on the same `<img>` element, not a new element — `content.js` specifically
  watches `src`/`srcset` attribute changes (not just newly added nodes) and clears
  the "already scanned" flag so the swapped-in image gets (re)classified.

## Local development / testing

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `netguardian-extension/` folder (the one
   containing `manifest.json`).
4. Visit any page with images. Open the extension's service worker console from
   `chrome://extensions` → **service worker** link, and the page's own DevTools
   console, to watch for `[NetGuardian]` log lines if something looks off.
5. After editing any file, click the refresh icon on the extension card in
   `chrome://extensions` to reload it. If you changed `content/content.js` you also
   need to reload the tab you're testing on.
6. Toggle protection and change role/threshold from the toolbar popup and the
   Settings page and confirm images blur/unblur accordingly.

## Packaging for distribution / Chrome Web Store

From inside the `netguardian-extension/` folder (the manifest's parent directory):

```bash
# macOS / Linux
zip -r ../netguardian-extension.zip . -x ".*"

# or, to be explicit about what's included:
zip -r ../netguardian-extension.zip \
  manifest.json background content popup options icons
```

Then either:

- **Chrome Web Store**: upload `netguardian-extension.zip` directly in the
  [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
- **Manual/enterprise distribution**: use `chrome://extensions` → **Pack extension**
  and point it at the unpacked folder to produce a signed `.crx` + `.pem`.

Before uploading, bump `"version"` in `manifest.json` — the Web Store rejects
re-uploads that reuse a version number already published.

## Debugging tips

- The offscreen document has its own DevTools console: `chrome://extensions` →
  your extension card → **Inspect views: offscreen.html** (only appears while a
  classification is in flight or within the 2-minute idle window — trigger a scan
  first if you don't see it).
- The background service worker's console is at `chrome://extensions` → **service
  worker** link.
- If images stop blurring on a specific site, check both consoles for `[NetGuardian]`
  logs or `ng-*` error strings (`http-403`, `not-an-image`, `image-too-large`, etc.)
  before assuming the model itself is at fault.

## Notes / limitations

- `nsfwjs` runs a general-purpose classifier; treat its output as a heuristic
  signal, not a guarantee. False positives/negatives happen, especially at the
  default threshold.
- The text-flagging term list is intentionally small and conservative to avoid
  false positives against unrelated words. Expand `FLAGGED_TERMS` in
  `content/content.js` if you need broader coverage.
- Requesting `host_permissions: ["<all_urls>"]` is what makes cross-origin image
  scanning possible, but it's also the most sensitive permission an extension can
  ask for — be prepared to justify it during Chrome Web Store review.
