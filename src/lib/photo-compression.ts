export const PHOTO_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;
const TARGET_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_DIMENSION = 3200;
const MAX_ATTEMPTS = 6;

/** Only oversized photos are changed. Each call owns and releases its decoded image. */
export async function compressPhoto(file: File): Promise<File> {
  if (file.size <= PHOTO_UPLOAD_LIMIT_BYTES) return file;

  const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const canvas = document.createElement('canvas');

  try {
    if (!image.width || !image.height) {
      throw new Error('Dimensions de la photo invalides');
    }

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossible de préparer la photo');

    let scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      // JPEG has no transparency. Give transparent PNG/WebP photos a white background.
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result && result.type === 'image/jpeg' && result.size > 0) {
            resolve(result);
          } else {
            reject(new Error('Impossible de compresser la photo'));
          }
        }, 'image/jpeg', 0.9);
      });

      if (blob.size <= TARGET_SIZE_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        });
      }

      scale *= 0.75;
    }

    throw new Error('La photo reste trop volumineuse après compression');
  } finally {
    image.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
