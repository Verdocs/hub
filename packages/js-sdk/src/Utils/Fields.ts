/**
 * @sdkOperation field.getRTop
 * @sdkGroup Field
 * @sdkPage Helpers
 */
export function getRTop(y: number, fieldHeight: number, iTextHeight: number, yRatio: number) {
  return iTextHeight - (y + fieldHeight) * yRatio;
}

/**
 * @sdkOperation field.getRLeft
 * @sdkGroup Field
 * @sdkPage Helpers
 */
export function getRLeft(x: number, ratio: number) {
  return x * ratio;
}

/**
 * @sdkOperation field.getRValue
 * @sdkGroup Field
 * @sdkPage Helpers
 */
export function getRValue(y: number, ratio: number) {
  return y * ratio;
}

/**
 * @sdkOperation field.blobToBase64
 * @sdkGroup Field
 * @sdkPage Helpers
 */
export function blobToBase64(image: Blob) {
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onerror = () => {
      reject(new DOMException('Problem reading blob.'));
    };

    fileReader.onload = () => {
      resolve(fileReader.result);
    };

    fileReader.readAsDataURL(image);
  });
}

/**
 * @sdkOperation field.rescale
 * @sdkGroup Field
 * @sdkPage Helpers
 */
export function rescale(r: number, n: number): number {
  return r * n;
}
