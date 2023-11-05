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
export interface Event {
  endTime: number;
  eventType: number;
  startTime: number;
  sampleIndex?: number;
}
export interface SessionData {
  RespuratoryEvents: Event[];
  StateEvents: Event[];
}
export interface Session {
  Data: SessionData[];
  FileVersion: string;
  Lang: string;
  PAtientAge: number;
  PatientBMI: number;
  PatientHeight: number;
  PatientName: string;
  PatientWeigth: string;
  SessionDevice: string;
  SessionType: string;
  UserID: string;
}
