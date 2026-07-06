import mongoose, { Schema, model, models } from "mongoose";

const InterviewSchema = new Schema(
  {
    role: { type: String, required: true },
    description: { type: String, required: false },
    isPublic: { type: Boolean, default: true },
    type: { type: String, required: true },
    level: { type: String, required: true },
    techstack: { type: [String], required: true },
    questions: { type: [String], required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    finalized: { type: Boolean, default: false },
    coverImage: { type: String, optional: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Interview = models.Interview || model("Interview", InterviewSchema);

export default Interview;
