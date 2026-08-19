// background/service-worker.js
// Responsibilities:
//   1. Initialize default settings on install (single source of truth: "netguardian_settings").
//   2. Lazily create/reuse an offscreen document and relay classification requests to it.
//      (Actual fetch + model inference happens in offscreen/offscreen.js — see that file
//      for why it isn't done here or in a content-script-owned worker.)
//   3. Close the offscreen document after a period of inactivity to free the model's memory.

const DEFAULT_SETTINGS = { enabled: true, role: "Adult", threshold: 0.7 };
const OFFSCREEN_URL = "offscreen/offscreen.html";
const IDLE_ALARM_NAME = "ng-close-offscreen";
const IDLE_MINUTES = 2;

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install") return;
  const existing = await chrome.storage.local.get("netguardian_settings");
  if (!existing.netguardian_settings) {
    await chrome.storage.local.set({ netguardian_settings: DEFAULT_SETTINGS });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "ng-classify-image") return false;

  (async () => {
    try {
      await ensureOffscreenDocument();
      const result = await chrome.runtime.sendMessage({
        type: "ng-run-classification",
        url: msg.url,
        threshold: msg.threshold,
      });
      resetIdleAlarm();
      sendResponse(result);
    } catch (err) {
      sendResponse({ unsafe: false, score: 0, error: String((err && err.message) || err) });
    }
  })();

  return true; // keep the message channel open for the async response
});

let creatingOffscreen = null;
async function ensureOffscreenDocument() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  if (existing.length > 0) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ["BLOBS"],
    justification: "Runs on-device NSFW image classification outside any web page's CSP.",
  });

  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

function resetIdleAlarm() {
  chrome.alarms.create(IDLE_ALARM_NAME, { delayInMinutes: IDLE_MINUTES });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== IDLE_ALARM_NAME) return;
  const existing = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
  if (existing.length > 0) {
    try {
      await chrome.offscreen.closeDocument();
    } catch {
      /* already closed */
    }
  }
});
