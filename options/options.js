const thresholdInput = document.getElementById('threshold');
const saveBtn = document.getElementById('save');

const defaultSettings = { enabled: true, role: 'Adult', threshold: 0.7 };

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['netguardian_settings'], res => {
    const s = res.netguardian_settings || defaultSettings;
    thresholdInput.value = s.threshold ?? defaultSettings.threshold;
  });
});

saveBtn.addEventListener('click', () => {
  chrome.storage.local.get(['netguardian_settings'], res => {
    const s = res.netguardian_settings || defaultSettings;
    s.threshold = parseFloat(thresholdInput.value);
    chrome.storage.local.set({ netguardian_settings: s }, () => alert('Saved'));
  });
});
