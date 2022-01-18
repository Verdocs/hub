export function getRTop(y: number, fieldHeight: number, iTextHeight: number, yRatio: number) {
  return iTextHeight - (y + fieldHeight) * yRatio;
}

export function getRLeft(x: number, ratio: number) {
  return x * ratio;
}

export function getRValue(y: number, ratio: number) {
  return y * ratio;
}

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

export function rescale(r: number, n: number): number {
  return r * n;
}
