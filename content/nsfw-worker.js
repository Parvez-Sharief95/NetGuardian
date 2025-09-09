// content/nsfw-worker.js
self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.8.0/dist/tf.min.js');
// NOTE: For prototype, we attempt to load a lightweight model. Replace with your own hosted TF model or nsfwjs.
let model = null;
async function loadModel() {
  if (model) return model;
  try {
    // Example: you'd host a tiny model or use nsfwjs. This is a placeholder path.
    // model = await tf.loadGraphModel(chrome.runtime.getURL('models/tfjs_model/model.json'));
    // For now, model stays null and we'll use a simple skin-tone / brightness heuristic as fallback.
  } catch (e) {
    // fallback
  }
  return model;
}

self.onmessage = async (e) => {
  const { image, threshold = 0.7, role } = e.data;
  await loadModel();

  try {
    // Fallback heuristic: compute average brightness & saturation to catch very dark/light suspicious images
    const res = await fetch(image);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const off = new OffscreenCanvas(64, 64);
    const ctx = off.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, 64, 64);
    const imgdata = ctx.getImageData(0, 0, 64, 64);
    let r=0,g=0,b=0;
    for(let i=0;i<imgdata.data.length;i+=4){
      r += imgdata.data[i];
      g += imgdata.data[i+1];
      b += imgdata.data[i+2];
    }
    const px = imgdata.data.length / 4;
    const avg = (r+g+b) / (3*px) / 255; // 0..1
    // Simple scoring: darker or high-contrast images get slightly higher score
    let score = 1 - avg; // dark -> higher
    score = Math.min(Math.max(score, 0), 1);
    const unsafe = score >= threshold; // very naive fallback

    self.postMessage({ unsafe, score });
  } catch (err) {
    self.postMessage({ unsafe: false, score: 0 });
  }
};
