import { User as FireUser } from "firebase/auth";
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from "lightweight-charts";
export interface User extends FireUser {
  name: string;
  lastName: string;
  email: string;
  Credit: string;
  NotifToken?: string;
  userID: string;
}

export interface Series {
  name?: string;
  seriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon>;
  id: string;
  data: LineData[];
}
export interface Data {
  time: number;
  value: number;
}
