export interface IFileWithData {
  lastModified: number;
  size: number;
  type: string;
  name: string;
  data: string;
}

export interface ICountry {
  code: string;
  name: string;
  value: string;
}

export interface ITimePeriod {
  start_time: string;
  end_time: string;
}
