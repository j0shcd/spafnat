import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compressPhoto, PHOTO_UPLOAD_LIMIT_BYTES } from '../lib/photo-compression';

function largePhoto(name = 'photo.png'): File {
  const file = new File(['original'], name, { type: 'image/png', lastModified: 123 });
  Object.defineProperty(file, 'size', { value: PHOTO_UPLOAD_LIMIT_BYTES + 1 });
  return file;
}

describe('photo compression', () => {
  let canvas: HTMLCanvasElement;
  let image: { width: number; height: number; close: ReturnType<typeof vi.fn> };
  let context: { fillStyle: string; fillRect: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    canvas = document.createElement('canvas');
    image = { width: 8000, height: 6000, close: vi.fn() };
    context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(image));
    vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag, options) =>
      tag === 'canvas' ? canvas : createElement(tag, options));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('leaves photos at or below 5 MiB untouched without decoding', async () => {
    const file = new File(['small'], 'small.jpg', { type: 'image/jpeg' });
    expect(await compressPhoto(file)).toBe(file);
    Object.defineProperty(file, 'size', { value: PHOTO_UPLOAD_LIMIT_BYTES });
    expect(await compressPhoto(file)).toBe(file);
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('keeps high JPEG quality and accepts a detailed photo over 1 MiB', async () => {
    const jpeg = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/jpeg' });
    const encode = vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => callback(jpeg));
    const source = largePhoto('holiday.photo.PNG');
    const output = await compressPhoto(source);

    expect(output.name).toBe('holiday.photo.jpg');
    expect(output.type).toBe('image/jpeg');
    expect(output.size).toBe(jpeg.size);
    expect(output.lastModified).toBe(source.lastModified);
    expect(source.name).toBe('holiday.photo.PNG');
    expect(createImageBitmap).toHaveBeenCalledWith(source, { imageOrientation: 'from-image' });
    expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0, 3200, 2400);
    expect(context.fillStyle).toBe('#fff');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 3200, 2400);
    expect(encode).toHaveBeenCalledExactlyOnceWith(expect.any(Function), 'image/jpeg', 0.9);
    expect(image.close).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });

  it('reduces dimensions again only when the actual encoded file exceeds 4 MiB', async () => {
    const oversized = new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], { type: 'image/jpeg' });
    const accepted = new Blob([new Uint8Array(4 * 1024 * 1024)], { type: 'image/jpeg' });
    vi.spyOn(canvas, 'toBlob')
      .mockImplementationOnce((callback) => callback(oversized))
      .mockImplementationOnce((callback) => callback(accepted));
    expect((await compressPhoto(largePhoto())).size).toBe(accepted.size);
    expect(context.drawImage).toHaveBeenNthCalledWith(2, image, 0, 0, 2400, 1800);
    expect(image.close).toHaveBeenCalledOnce();
  });

  it('never upscales portrait photos', async () => {
    image.width = 900;
    image.height = 1200;
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback) =>
      callback(new Blob(['jpeg'], { type: 'image/jpeg' })));
    await compressPhoto(largePhoto());
    expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0, 900, 1200);
  });

  it('bounds unsuccessful compression and releases image memory', async () => {
    const oversized = new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], { type: 'image/jpeg' });
    const encode = vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => callback(oversized));
    await expect(compressPhoto(largePhoto())).rejects.toThrow('reste trop volumineuse');
    expect(encode).toHaveBeenCalledTimes(6);
    expect(image.close).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(0);
  });

  it.each(['null', 'empty', 'png', 'throw'])('rejects %s encoding output and releases resources', async (failure) => {
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => {
      if (failure === 'throw') throw new Error('encode failed');
      callback(failure === 'null' ? null : new Blob(failure === 'empty' ? [] : ['png'], {
        type: failure === 'png' ? 'image/png' : 'image/jpeg',
      }));
    });
    await expect(compressPhoto(largePhoto())).rejects.toThrow();
    expect(image.close).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(0);
  });

  it('releases the decoded image when canvas is unavailable', async () => {
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    await expect(compressPhoto(largePhoto())).rejects.toThrow('préparer');
    expect(image.close).toHaveBeenCalledOnce();
  });
});
