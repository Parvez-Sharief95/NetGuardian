// background/service-worker.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('NETGUARDIAN installed');
});

// Simple message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ping') sendResponse({ pong: true });
});
