// content/nsfw-worker.js
self.importScripts('libs/tf.min.js', 'libs/nsfwjs.min.js');

let model = null;
async function loadModel() {
  if (model) return model;
  try {
    model = await nsfwjs.load(); // default local hosted model
    console.log('[NG-worker] model loaded');
  } catch (err) {
    console.error('[NG-worker] model load failed', err);
  }
  return model;
}

self.onmessage = async (e) => {
  console.log('[NG-worker] received message', e.data);
  const { image, threshold = 0.7 } = e.data;
  try {
    const mdl = await loadModel();
    if (!mdl) {
      self.postMessage({ unsafe: false, score: 0, error: 'model-not-loaded' });
      return;
    }

    const res = await fetch(image);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const predictions = await mdl.classify(bitmap);

    let unsafe = false, maxProb = 0, maxClass = null;
    for (const p of predictions) {
      if (p.probability > maxProb) { maxProb = p.probability; maxClass = p.className; }
      if ((p.className === "Porn" || p.className === "Hentai" || p.className === "Sexy") && p.probability >= threshold) unsafe = true;
    }
    console.log('[NG-worker] predictions', predictions);
    self.postMessage({ unsafe, score: maxProb, label: maxClass, predictions });
  } catch (err) {
    console.error('[NG-worker] error classifying', err);
    self.postMessage({ unsafe: false, score: 0, error: String(err) });
  }
};
