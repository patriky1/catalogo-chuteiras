/**
 * Reduz e comprime a foto no próprio navegador antes do envio.
 * Fotos de celular (3–10 MB) viram arquivos de ~150–400 KB, deixando o upload
 * rápido e o site leve, sem precisar de serviço externo de imagens.
 */
const MAX_SIDE = 1600;
const QUALITY = 0.85;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler esta imagem. Tente outra foto (JPG, PNG ou WEBP).'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file) {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // fundo branco para PNG com transparência
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // WEBP quando o navegador suporta; senão JPEG
  let blob = await canvasToBlob(canvas, 'image/webp', QUALITY);
  let type = 'image/webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', QUALITY);
    type = 'image/jpeg';
  }
  if (!blob) throw new Error('Não foi possível processar a imagem.');

  // Se a original já era menor e não precisou redimensionar, mantém a original
  if (scale === 1 && file.size <= blob.size && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return file;
  }
  const base = file.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${base}.${type === 'image/webp' ? 'webp' : 'jpg'}`, { type });
}
