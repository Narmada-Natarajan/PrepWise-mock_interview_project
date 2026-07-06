import mongoose, { Schema, model, models } from "mongoose";

const FeedbackSchema = new Schema(
  {
    interviewId: { type: Schema.Types.ObjectId, ref: "Interview", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalScore: { type: Number, required: true },
    categoryScores: [
      {
        name: { type: String, required: true },
        score: { type: Number, required: true },
        comment: { type: String, required: true },
      },
    ],
    strengths: { type: [String], required: true },
    areasForImprovement: { type: [String], required: true },
    finalAssessment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Feedback = models.Feedback || model("Feedback", FeedbackSchema);

export default Feedback;
