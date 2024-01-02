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
  Age: number;
  Data: SessionData;
  Device: string;
  DeviceId: string;
  EngineType: string;
  FrameRate: number;
  Gender: number;
  Height: number;
  Lang: string;
  Name: string;
  NumHistoryFrames: number;
  NumIntegratedFrames: number;
  PAtientAge: number;
  PatientBMI: number;
  PatientHeight: number;
  PatientName: string;
  PatientSurname: string;
  PatientWeigth: number;
  Sensitivity: number;
  SessionAwakeTime: number;
  SessionCentralApneas: number;
  SessionDuration: number;
  SessionEndTime: number;
  SessionIAH: string;
  SessionId: string;
  SessionNumAwakes: number;
  SessionSleepLatency: number;
  SessionNumRespEvents: number;
  SessionSleepTime: number;
  SessionStartTime: number;
  Surname: string;
  TimeZoneOffset: number;
  Type: string;
  Weight: number;
  userId: string;
}

export interface SessionResponse {
  [key: string]: Session;
}
