// popup/popup.js
const toggle = document.getElementById('toggleEnabled');
const roleSel = document.getElementById('roleSelect');
const openOptionsBtn = document.getElementById('openOptions');
const status = document.getElementById('status');

const defaultSettings = { enabled: true, role: 'Adult', threshold: 0.7 };

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['netguardian_settings'], (res) => {
    const s = res.netguardian_settings || defaultSettings;
    toggle.checked = !!s.enabled;
    roleSel.value = s.role || 'Adult';
    status.textContent = 'Ready';
  });
});

toggle.addEventListener('change', () => save());
roleSel.addEventListener('change', () => save());
openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

function save() {
  const settings = { enabled: toggle.checked, role: roleSel.value, threshold: defaultSettings.threshold };
  chrome.storage.local.set({ netguardian_settings: settings }, () => {
    status.textContent = 'Saved';
    setTimeout(() => status.textContent = '', 1000);
  });
}
