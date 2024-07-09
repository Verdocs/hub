import type {ITimePeriod} from './Types';

const YEAR = 365 * 24 * 60 * 60;
// const MONTH = 30 * 24 * 60 * 60;
const WEEK = 7 * 24 * 60 * 60;
const DAY = 24 * 60 * 60;
const HOUR = 60 * 60;
const MINUTE = 60;

export const formatShortTimeAgo = (val: any) => {
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

  const timeDiff = Math.floor((new Date().getTime() - dateInput.getTime()) / 1000);
  if (timeDiff >= YEAR) {
    return Math.floor(timeDiff / YEAR) + 'Y';
  }
  // if (timeDiff >= MONTH) {
  //   return Math.floor(timeDiff / MONTH) + 'M';
  // }
  if (timeDiff >= WEEK) {
    return Math.floor(timeDiff / WEEK) + 'W';
  }
  if (timeDiff >= DAY) {
    return Math.floor(timeDiff / DAY) + 'D';
  }
  if (timeDiff >= HOUR) {
    return Math.floor(timeDiff / HOUR) + 'H';
  }
  if (timeDiff >= MINUTE) {
    return Math.floor(timeDiff / MINUTE) + 'M';
  }

  return `${timeDiff}S`;
};

export function timePeriod(type: string): ITimePeriod | null {
  let endDate = new Date().getTime();
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  let startDate = null;
  switch (type) {
    case '30d':
      startDate = endDate - 60 * 60 * 24 * 30 * 1000;
      break;

    case '60d':
      startDate = endDate - 60 * 60 * 24 * 60 * 1000;
      break;

    case '6m':
      startDate = endDate - 60 * 60 * 24 * 30 * 6 * 1000;
      break;

    case 'this_month':
      startDate = new Date(year, month, 1).getTime();
      break;

    case 'last_month':
      startDate = new Date(year, month - 1, 1).getTime();
      endDate = new Date(year, month, 0).getTime();
      break;

    case 'this_year':
      startDate = new Date(year, 0, 1);
      break;

    case 'all_time':
    default:
      return null;
  }

  if (startDate === null && endDate === null) {
    return null;
  }

  return {
    start_time: new Date(startDate).toISOString(),
    end_time: new Date(endDate).toISOString(),
  } as ITimePeriod;
}
