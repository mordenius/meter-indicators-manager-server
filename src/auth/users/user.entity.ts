import { Schema, Model, model, ObjectId, Document } from "mongoose";

import { ReqisterTool } from "./../_frameworks";

export const COLLECTION_NAME = "User";
export const USER_MODEL_NAME = "USER_MODEL";

export interface UserInDto {
  email: string;
  pswd: string;
}

export interface UserOutDto {
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends Document, UserOutDto {
  _id: ObjectId;
  pswd?: string;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    pswd: { type: String, required: true, select: false }
  },
  {
    timestamps: true
  }
);

export const User = ReqisterTool<Model<UserDocument>>(USER_MODEL_NAME, () =>
  model<UserDocument>(COLLECTION_NAME, userSchema)
)();
