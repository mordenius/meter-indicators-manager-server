import { Schema, model, ObjectId, Model, Types, Document } from "mongoose";

import { ReqisterTool } from "../_frameworks";

import { UserDocument } from "./user.entity";

export const COLLECTION_NAME = "Session";
export const SESSION_MODEL_NAME = "SESSION_MODEL";

export interface SessionInDto {
  accessToken: string;
  refreshToken: string;
  userAgent: string;
  user: string;
}

export interface SessionOutDto {
  accessToken: string;
  refreshToken: string;
  userAgent: string;
  user: ObjectId;
  createdAt: Date;
}

export interface SessionOutPopulatedDto {
  accessToken: string;
  refreshToken: string;
  userAgent: string;
  user: UserDocument;
  createdAt: Date;
}

export interface SessionDocument extends Document, SessionOutDto {
  _id: ObjectId;
}

export const sessionSchema = new Schema<SessionDocument>(
  {
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    userAgent: { type: String, required: true },
    user: { type: Types.ObjectId, required: true }
  },
  { timestamps: true }
);

export const Session = ReqisterTool<Model<SessionDocument>>(
  SESSION_MODEL_NAME,
  () => model<SessionDocument>(COLLECTION_NAME, sessionSchema)
)();
