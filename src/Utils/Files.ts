import {IFileWithData} from './Types';

/**
 * Given a File, extract the file's content as a base64 encoded data URL. The response will have a prefix that
 * includes the MIME type of the file, e.g. "data:image/jpeg;base64,iVBORw0K......"
 */
export const fileToDataUrl = (file: File): Promise<IFileWithData> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve({
        lastModified: file.lastModified,
        size: file.size,
        type: file.type,
        name: file.name,
        data: reader.result as string,
      });

    reader.onerror = reject;

    if (file) {
      reader.readAsDataURL(file);
    } else {
      reject(new Error('Invalid file'));
    }
  });

/**
 * Trigger a download dialog to save a blob as a file on disk.
 */
export const downloadBlob = (blob: Blob, name = 'file.pdf') => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = blobUrl;
  link.download = name;
  document.body.appendChild(link);

  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );

  document.body.removeChild(link);
};
