import { User as FireUser } from "firebase/auth";
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
  data: Data[];
}
export interface Data {
  x: number;
  y: number;
}
