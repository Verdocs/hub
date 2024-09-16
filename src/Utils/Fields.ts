import {IEnvelopeField, ITemplateField} from '../Models';

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

/**
 * Utility function to sort fields by page, then by Y coordinate, then by X coordinate.
 * NOTE: This function mutates the input array.
 */
export function sortFields(fields: ITemplateField[] | IEnvelopeField[]) {
  fields.sort((a, b) => {
    const aPage = a.page || 0;
    const bPage = b.page || 0;
    const aX = a.x || 0;
    const aY = a.y || 0;
    const bX = b.x || 0;
    const bY = b.y || 0;

    if (aPage !== bPage) {
      return aPage - bPage;
    }

    // NOTE: Logic looks a little strange X vs Y. It's because we go top down,
    // left to right. But Y coordinates are inverted in PDFs. The reason for
    // the division is because no human makes perfect templates and frequently
    // two fields on the "same line" will be slightly offset vertically.
    const divaY = Math.floor(aY / 5);
    const divbY = Math.floor(bY / 5);
    if (divaY !== divbY) {
      return divbY - divaY;
    }

    return aX - bX;
  });

  return fields;
}
