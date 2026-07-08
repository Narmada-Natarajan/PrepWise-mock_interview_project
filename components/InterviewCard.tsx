import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn, getRandomInterviewCover } from "@/lib/utils";
import { getFeedbackByInterviewId, deleteInterview } from "@/lib/actions/general.action";

const InterviewCard = async ({
  interviewId,
  userId,
  interviewUserId,
  role,
  description,
  isPublic,
  type,
  techstack,
  createdAt,
}: InterviewCardProps) => {
  const feedback =
    userId && interviewId
      ? await getFeedbackByInterviewId({
          interviewId,
          userId,
        })
      : null;

  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

  const badgeColor =
    {
      Behavioral: "bg-light-400",
      Mixed: "bg-light-600",
      Technical: "bg-light-800",
    }[normalizedType] || "bg-light-600";

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          {/* Type Badge */}
          <div
            className={cn(
              "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
              badgeColor
            )}
          >
            <p className="badge-text ">{normalizedType}</p>
          </div>

          {/* Letter Avatar */}
          <div
            className={cn(
              "rounded-full flex items-center justify-center size-[90px] text-4xl font-bold text-white shadow-md",
              badgeColor
            )}
          >
            {role?.[0]?.toUpperCase() || "I"}
          </div>

          {/* Interview Role */}
          <h3 className="mt-5 capitalize text-white">{role} Interview</h3>

          {/* Date & Score */}
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image
                src="/calendar.svg"
                width={22}
                height={22}
                alt="calendar"
              />
              <p>{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" width={22} height={22} alt="star" />
              <p>{feedback?.totalScore !== undefined ? feedback.totalScore : "---"}/100</p>
            </div>
          </div>

          {/* Feedback or Description or Placeholder Text */}
          <p className="line-clamp-2 mt-5 text-light-400">
            {feedback?.finalAssessment || 
              description ||
              "You haven't taken this interview yet. Take it now to improve your skills."}
          </p>

          {/* Private Status Label */}
          {!isPublic && (
            <div className="absolute bottom-2 left-6 bg-dark-300 text-light-100 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-light-800 shadow-sm">
                <div className="size-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Private Model
            </div>
          )}
        </div>

        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            {feedback && interviewId && (
              <form action={deleteInterview}>
                <input type="hidden" name="interviewId" value={interviewId} />
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="feedbackId" value={feedback.id} />
                <button
                  type="submit"
                  className="flex items-center justify-center size-9 rounded-xl bg-white/10 hover:bg-destructive/80 backdrop-blur-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Delete past interview"
                >
                  <Trash2 className="w-4 h-4 text-white/70 hover:text-white" />
                </button>
              </form>
            )}
            <DisplayTechIcons techStack={techstack} />
          </div>

          <Button className="btn-primary">
            <Link
              href={
                feedback
                  ? `/interview/${interviewId}/feedback`
                  : `/interview/${interviewId}`
              }
            >
              {feedback ? "Check Feedback" : "View Interview"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
