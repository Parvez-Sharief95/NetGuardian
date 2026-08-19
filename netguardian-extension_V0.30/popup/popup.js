// popup/popup.js
const DEFAULT_SETTINGS = { enabled: true, role: "Adult", threshold: 0.7 };
const ROLE_THRESHOLDS = { Minor: 0.4, Parent: 0.55, Adult: 0.7 };

const toggle = document.getElementById("toggleEnabled");
const roleSel = document.getElementById("roleSelect");
const openOptionsBtn = document.getElementById("openOptions");
const status = document.getElementById("status");

let statusTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  const res = await chrome.storage.local.get(["netguardian_settings"]);
  const s = { ...DEFAULT_SETTINGS, ...(res.netguardian_settings || {}) };
  toggle.checked = !!s.enabled;
  roleSel.value = s.role || DEFAULT_SETTINGS.role;
});

toggle.addEventListener("change", () => save({ enabled: toggle.checked }));

// Changing role resets the threshold to that role's sensible default so the
// selector actually has an effect. Fine-grained overrides still live in Settings.
roleSel.addEventListener("change", () =>
  save({ role: roleSel.value, threshold: ROLE_THRESHOLDS[roleSel.value] ?? DEFAULT_SETTINGS.threshold })
);

openOptionsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

async function save(partial) {
  const res = await chrome.storage.local.get(["netguardian_settings"]);
  const current = { ...DEFAULT_SETTINGS, ...(res.netguardian_settings || {}) };
  const next = { ...current, ...partial };
  await chrome.storage.local.set({ netguardian_settings: next });
  showStatus("Saved");
}

function showStatus(text) {
  status.textContent = text;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (status.textContent = ""), 1200);
}
