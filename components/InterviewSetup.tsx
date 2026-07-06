"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateInterviewQuestions } from "@/lib/actions/general.action";

interface InterviewSetupProps {
  onComplete: (questions: string[], jd: string, level: string) => void;
}

export default function InterviewSetup({ onComplete }: InterviewSetupProps) {
  const [formData, setFormData] = useState({
    jd: "",
    description: "",
    language: "English",
    level: "Middle",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [generatedData, setGeneratedData] = useState<{ questions: string[], jd: string, level: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jd || !formData.description) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await generateInterviewQuestions(formData);
      if (result.success && result.questions) {
        setGeneratedData({
          questions: result.questions,
          jd: formData.jd,
          level: formData.level
        });
        setShowTimer(true);
      } else {
        toast.error(result.message || "Failed to generate questions.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showTimer && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (showTimer && timeLeft === 0 && generatedData) {
      onComplete(generatedData.questions, generatedData.jd, generatedData.level);
    }
    return () => clearInterval(timer);
  }, [showTimer, timeLeft, generatedData, onComplete]);

  if (showTimer) {
    return (
      <div className="max-w-2xl mx-auto p-12 glassmorphism card flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-primary/10"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={377}
              strokeDashoffset={377 - (377 * timeLeft) / 15}
              className="text-primary transition-all duration-1000 ease-linear"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-4xl font-black gradient-text">{timeLeft}</span>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Setting up the interview env</h2>
          <p className="text-muted-foreground animate-pulse">Initializing AI modules, adjusting media streams, and preparing the exam environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 glassmorphism card space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight gradient-text">Interview Setup</h2>
        <p className="text-muted-foreground">
          Tell us about the position and your preferences to tailor the interview.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jd" className="text-sm font-semibold uppercase tracking-wider text-foreground/70 dark:text-muted-foreground ml-1">
              Job Description / Role Title
            </Label>
            <Input
              id="jd"
              placeholder="e.g. Senior Frontend Developer at Google"
              value={formData.jd}
              onChange={(e) => setFormData({ ...formData, jd: e.target.value })}
              className="bg-card/30 rounded-xl border-foreground/10 dark:border-white/10 h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold uppercase tracking-wider text-foreground/70 dark:text-muted-foreground ml-1">
              Additional Details / Skills Focus
            </Label>
            <textarea
              id="description"
              placeholder="e.g. Focus on React, Next.js, and system design..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[120px] bg-card/30 rounded-xl border border-foreground/10 dark:border-white/10 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all custom-scrollbar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wider text-foreground/70 dark:text-muted-foreground ml-1">
                Interview Language
              </Label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full bg-card/30 rounded-xl border border-foreground/10 dark:border-white/10 h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
                <option value="Chinese">Chinese</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wider text-foreground/70 dark:text-muted-foreground ml-1">
                Experience Level
              </Label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full bg-card/30 rounded-xl border border-foreground/10 dark:border-white/10 h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
              >
                <option value="Intern">Intern</option>
                <option value="Junior">Junior</option>
                <option value="Middle">Middle</option>
                <option value="Senior">Senior</option>
                <option value="Team Lead">Team Lead</option>
              </select>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-2xl font-black text-lg gradient-btn shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Initialising...
            </div>
          ) : (
            "Start Interview"
          )}
        </Button>
      </form>
    </div>
  );
}
