import {IDocumentField} from '../Documents/Documents';

export function getHeight(field: IDocumentField) {
  const settings = field.settings || field.setting || {};
  switch (field.type) {
    case 'signature':
    case 'initial':
      return 36;

    case 'checkbox':
    case 'checkbox_group':
    case 'radio_button_group':
      return 13.5;

    case 'attachment':
    case 'payment':
      return 24;
  }
  return settings.height || 0;
}

export function getWidth(field: IDocumentField) {
  const settings = field.settings || field.setting || {};
  switch (field.type) {
    case 'signature':
    case 'initial':
      return 82.63636363636;

    case 'checkbox':
    case 'checkbox_group':
    case 'radio_button_group':
      return 13.5;

    case 'attachment':
    case 'payment':
      return 24;

    case 'date':
      return 64;

    case 'dropdown':
      return settings?.width || 64;
  }

  return settings?.width || 0;
}

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

export function getInputStyle(field: IDocumentField, mode: string, browserType: string) {
  const settings = field.settings || field.setting || {};
  const fontSize = settings?.font_size || 11;

  const style = {
    height: '100%',
    width: '100%',
    background: 'none',
  } as Record<string, string>;

  if (
    settings.font_size ||
    field.type === 'date' ||
    field.type === 'signature' ||
    field.type === 'initial' ||
    field.type === 'timestamp'
  ) {
    style.fontSize = fontSize + 'px';
    style.letterSpacing = '.3px !important';
  }

  if (field.type === 'dropdown') {
    style.fontSize = '10.8px';
    delete style.background;
  }

  if (field.type === 'textbox') {
    style.fontSize = fontSize + 'px';
    style.letterSpacing = getLetterSpacing(browserType) + 'px';
  }

  if (field.required) {
    style.border = '1px solid #cc0000';
  }

  if (field?.prepared === true && mode !== 'prepareview') {
    style.visibility = 'hidden';
  }

  if (settings.color) {
    style.color = settings.color;
  }

  if (settings.upperCase) {
    style.textTransform = 'uppercase';
  }

  if (settings.leading) {
    style.lineHeight = `${rescale(1, settings.leading + 0.5)}px`;
  }

  return style;
}

export function getCheckboxLabelStyle(required: boolean) {
  const labelStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    cursor: 'pointer',
    height: `13.5px`,
    width: `13.5px`,
    backgroundColor: 'transparent',
    border: '1px solid #777',
  } as Record<string, any>;

  if (required) {
    labelStyle.boxShadow = '0 0 0 1px #cc0000';
  }

  return labelStyle;
}

export function getLetterSpacing(browserType: string) {
  switch (browserType) {
    case 'opera':
      return -0.0018;
    case 'firefox':
      return -0.23594210526315787;
    case 'ie':
      return -0.0019;
    case 'edge':
      return -0.0019;
    case 'chrome':
      return -0.0018;
    case 'safari':
      return -0.0018;
    case 'blink':
      return -0.0018;
    default:
      return -0.0018;
  }
}

export function rescale(r: number, n: number): number {
  return r * n;
}
