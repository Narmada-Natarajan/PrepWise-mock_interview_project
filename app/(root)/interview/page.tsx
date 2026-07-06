"use client";

import { useState, useEffect } from "react";
import Agent from "@/components/Agent";
import InterviewSetup from "@/components/InterviewSetup";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { createInterview } from "@/lib/actions/general.action";

const InterviewPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const handleSetupComplete = async (generatedQuestions: string[], jd: string, level: string) => {
    if (!user) return;
    
    setQuestions(generatedQuestions);
    
    // Create interview record in DB
    const res = await createInterview({
      userId: user.id,
      role: jd,
      level: level,
      questions: generatedQuestions,
      finalized: false,
      type: "AI Mock Interview",
      techstack: [],
    });

    if (res.success) {
      setInterviewId(res.id);
      setIsSetupComplete(true);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-8 space-y-12">
      {!isSetupComplete ? (
        <div className="animate-in fade-in zoom-in-95 duration-500">
           <InterviewSetup onComplete={handleSetupComplete} />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <Agent
            userName={user.name}
            userId={user.id}
            type="interview"
            questions={questions}
            interviewId={interviewId!}
          />
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
