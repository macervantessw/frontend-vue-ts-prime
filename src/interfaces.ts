import { User as FireUser } from "firebase/auth";
import { ISeriesApi, SeriesOptionsMap } from "lightweight-charts";
export interface User extends FireUser {
  name: string;
  lastName: string;
  email: string;
  Credit: string;
  NotifToken?: string;
  userID: string;
}

export interface Serie<T extends keyof SeriesOptionsMap> {
  name: string;
  serie: ISeriesApi<T>;
  id: string;
}
export interface Data {
  time: number;
  value: number;
}
