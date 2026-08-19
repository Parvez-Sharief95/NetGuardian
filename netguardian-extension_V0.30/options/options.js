// options/options.js
const DEFAULT_SETTINGS = { enabled: true, role: "Adult", threshold: 0.7 };

const thresholdInput = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");
const saveBtn = document.getElementById("save");
const status = document.getElementById("status");

let statusTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  const res = await chrome.storage.local.get(["netguardian_settings"]);
  const s = { ...DEFAULT_SETTINGS, ...(res.netguardian_settings || {}) };
  const t = typeof s.threshold === "number" ? s.threshold : DEFAULT_SETTINGS.threshold;
  thresholdInput.value = String(t);
  thresholdValue.textContent = t.toFixed(2);
});

thresholdInput.addEventListener("input", () => {
  thresholdValue.textContent = Number(thresholdInput.value).toFixed(2);
});

saveBtn.addEventListener("click", async () => {
  const res = await chrome.storage.local.get(["netguardian_settings"]);
  const current = { ...DEFAULT_SETTINGS, ...(res.netguardian_settings || {}) };
  current.threshold = Number(thresholdInput.value);
  await chrome.storage.local.set({ netguardian_settings: current });
  showStatus("Saved");
});

function showStatus(text) {
  status.textContent = text;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (status.textContent = ""), 1500);
}
