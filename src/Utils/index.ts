const YEAR = 365 * 24 * 60 * 60;
const MONTH = 30 * 24 * 60 * 60;
const WEEK = 7 * 24 * 60 * 60;
const DAY = 24 * 60 * 60;
const HOUR = 60 * 60;
const MINUTE = 60;

const formatShortTimeAgo = (val: any) => {
  if (val === undefined || val === null) {
    return '';
  }

  let dateInput;
  if (typeof val === 'string' || typeof val === 'number') {
    dateInput = new Date(val);
  } else if (typeof val === 'object') {
    dateInput = val;
  } else {
    return '';
  }

  let timeDiff = Math.floor((new Date().getTime() - dateInput.getTime()) / 1000);
  if (timeDiff >= YEAR) {
    return Math.floor(timeDiff / YEAR) + 'Y';
  }
  if (timeDiff >= MONTH) {
    return Math.floor(timeDiff / MONTH) + 'M';
  }
  if (timeDiff >= WEEK) {
    return Math.floor(timeDiff / WEEK) + 'W';
  }
  if (timeDiff >= DAY) {
    return Math.floor(timeDiff / DAY) + 'Y';
  }
  if (timeDiff >= HOUR) {
    return Math.floor(timeDiff / HOUR) + 'Y';
  }
  if (timeDiff >= MINUTE) {
    return Math.floor(timeDiff / MINUTE) + 'Y';
  }

  return `${timeDiff}S`;
};

export const TimeAndDate = {
  formatShortTimeAgo,
};
