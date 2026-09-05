export const PHOTO_MAX_CHARS = 450000;

export function compressImage(file, { maxSize = 900, quality = 0.72 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      reject(new Error('type'));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff8f3';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      let q = quality;
      let data = canvas.toDataURL('image/jpeg', q);
      while (data.length > PHOTO_MAX_CHARS && q > 0.4) {
        q -= 0.08;
        data = canvas.toDataURL('image/jpeg', q);
      }
      URL.revokeObjectURL(url);
      if (data.length > PHOTO_MAX_CHARS) {
        reject(new Error('size'));
        return;
      }
      resolve(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('type'));
    };
    img.src = url;
  });
}
