export interface FileWithData {
  lastModified: number;
  size: number;
  type: string;
  name: string;
  data: string;
}

/**
 * Given a File, extract the file's content as a base64 encoded data URL. The response will have a prefix that
 * includes the MIME type of the file, e.g. "data:image/jpeg;base64,iVBORw0K......"
 */
export const fileToDataUrl = (file: File): Promise<FileWithData> =>
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
