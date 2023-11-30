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
  RespiratoryEvents?: Event[] | undefined;
  SnoringEvents: Event[];
  StateEvents: Event[];
}
export interface Session {
  SessionId: string;
  Age: number;
  Data: SessionData;
  DeviceId: string;
  Device: string;
  EngineType: string;
  FrameRate: number;
  Gender: number;
  Height: number;
  Lang: string;
  Name: string;
  NumHistoryFrames: number;
  NumIntegratedFrames: number;
  Sensitivity: number;
  SessionAwakeTime: number;
  SessionCentralApneas: number;
  SessionDuration: number;
  SessionEndTime: number;
  SessionIAH: string;
  SessionNumAwakes: number;
  SessionNumRespEvents: number;
  SessionSleepTime: number;
  SessionStartTime: number;
  Surname: string;
  TimeZoneOffset: number;
  Type: string;
  PAtientAge: number;
  PatientBMI: number;
  PatientHeight: number;
  PatientName: string;
  PatientSurname: string;
  PatientWeigth: number;
}

export interface SessionResponse {
  [key: string]: Session;
}
