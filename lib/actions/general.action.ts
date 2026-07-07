"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import InterviewModel from "@/lib/models/Interview";
import FeedbackModel from "@/lib/models/Feedback";
import UserModel from "@/lib/models/User";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-flash-latest", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories.Your task is to evaluate. Remember always, If there are no strengths found then tell it.Don't request anything from user, Just give the feedback,You are an AI.",
    });

    await dbConnect();
    
    const feedbackData = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date(),
    };

    let result;
    if (feedbackId) {
       result = await FeedbackModel.findByIdAndUpdate(feedbackId, feedbackData, { new: true });
    } else {
       result = await FeedbackModel.create(feedbackData);
    }

    // --- NEW: Email Notification ---
    const user = await UserModel.findById(userId);
    if (user && user.email && user.receiveEmailNotifications !== false) {
      const { sendEmail } = await import("@/lib/mail");
      const scoresTable = (object.categoryScores as any)
        .map((s: any) => `<li><b>${s.name}</b>: ${s.score}/100 - ${s.comment}</li>`)
        .join("");

      await sendEmail({
        to: user.email,
        subject: `Your Mock Interview Results are Ready! - Score: ${object.totalScore}/100`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h1 style="color: #4f46e5;">PrepWise Results</h1>
            <p>Hello <b>${user.name}</b>,</p>
            <p>Your mock interview has been analyzed. You achieved a total score of <b>${object.totalScore}%</b>.</p>
            
            <h3>Feedback Breakdown:</h3>
            <ul>${scoresTable}</ul>

            <h3>Final Assessment:</h3>
            <p>${object.finalAssessment}</p>

            <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 0;"><b>Strengths:</b> ${object.strengths.join(", ")}</p>
              <p style="margin: 10px 0 0 0;"><b>Areas for Improvement:</b> ${object.areasForImprovement.join(", ")}</p>
            </div>

            <p style="margin-top: 40px; font-size: 0.9em; color: #666;">Keep practicing and you'll ace the real one!</p>
          </div>
        `,
      });
    }

    return { success: true, feedbackId: result?._id.toString() };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function deleteInterview(formData: FormData) {
  const interviewId = formData.get("interviewId") as string;
  const userId = formData.get("userId") as string;
  const feedbackId = formData.get("feedbackId") as string;
  if (!interviewId || !userId) return { success: false, message: "Missing parameters" };
  try {
    await dbConnect();
    if (feedbackId) {
      await FeedbackModel.findByIdAndDelete(feedbackId);
    } else {
      await FeedbackModel.deleteMany({ interviewId, userId });
    }
    const interview = await InterviewModel.findById(interviewId);
    if (interview && interview.userId.toString() === userId) {
      await InterviewModel.findByIdAndDelete(interviewId);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting interview:", error);
    return { success: false, message: "Failed to delete interview" };
  }
}

export async function createInterview(params: any) {
  try {
    await dbConnect();
    const result = await InterviewModel.create(params);
    return { success: true, id: result._id.toString() };
  } catch (error) {
    console.error("Error creating interview:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  await dbConnect();
  const interview = await InterviewModel.findById(id);
  if (!interview) return null;
  return {
    ...interview.toObject(),
    id: interview._id.toString(),
  } as Interview;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  await dbConnect();
  const feedback = await FeedbackModel.findOne({ interviewId, userId });
  if (!feedback) return null;
  return {
    ...feedback.toObject(),
    id: feedback._id.toString(),
  } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  await dbConnect();

  let takenInterviewIds: any[] = [];
  const filter: any = { finalized: true };

  if (userId) {
    // 1. Get taken interview IDs for this user
    const feedbacks = await FeedbackModel.find({ userId });
    takenInterviewIds = feedbacks.map((f: any) => f.interviewId);

    // 2. Filter for non-taken, (public OR own private models)
    filter._id = { $nin: takenInterviewIds };
    filter.$or = [{ isPublic: true }, { userId: userId }];
  } else {
    // Guest user: only show public ones
    filter.isPublic = true;
  }

  const interviews = await InterviewModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);

  return interviews.map((interview: any) => ({
    ...interview.toObject(),
    id: interview._id.toString(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  if (!userId) return [];
  
  await dbConnect();

  // 1. Get all feedbacks for the user to find taken interview IDs
  const feedbacks = await FeedbackModel.find({ userId });
  const takenInterviewIds = feedbacks.map((f: any) => f.interviewId);

  // 2. Find interviews that match these IDs
  const interviews = await InterviewModel.find({
    _id: { $in: takenInterviewIds },
  }).sort({ createdAt: -1 });

  return interviews.map((interview: any) => ({
    ...interview.toObject(),
    id: interview._id.toString(),
  })) as Interview[];
}

export async function generateInterviewQuestions(params: {
  jd: string;
  description: string;
  language: string;
  level: string;
}) {
  const { jd, description, language, level } = params;

  try {
    const { object } = await generateObject({
      model: google("gemini-flash-latest", {
        structuredOutputs: false,
      }),
      schema: z.object({
        questions: z.array(z.string()).min(5).max(7),
      }),
      prompt: `
        You are a professional HR manager and technical lead. 
        Generate 5-7 high-quality interview questions for a candidate based on the following:
        Job Description: ${jd}
        Additional Description: ${description}
        Preferred Language for the Interview: ${language}
        Candidate Seniority Level: ${level}
        
        The questions should be a mix of behavioral, technical, and situational appropriate for a ${level} level position.
        Ensure the questions are challenging but fair.
      `,
    });

    return { success: true, questions: object.questions };
  } catch (error) {
    console.error("Error generating questions:", error);
    return { success: false, message: "Failed to generate questions." };
  }
}
