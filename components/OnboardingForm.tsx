"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/lib/actions/onboarding.action";

const interestsOptions = [
  "Frontend Development",
  "Backend Development",
  "Fullstack Development",
  "Mobile App Development",
  "Data Science",
  "Machine Learning",
  "DevOps & SRE",
  "Cybersecurity",
  "Cloud Computing",
  "UI/UX Design",
  "Product Management",
  "Data Engineering",
];

export default function OnboardingForm() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeOnboarding(selectedInterests);
      if (result.success) {
        toast.success("Welcome aboard! Let's get started.");
        router.push("/");
      } else {
        toast.error(result.message || "Failed to save your interests. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {interestsOptions.map((interest) => (
          <div
            key={interest}
            className={`flex items-center space-x-4 p-5 rounded-[24px] border-2 transition-all cursor-pointer select-none ring-offset-background group ${
              selectedInterests.includes(interest)
                ? "bg-primary/10 border-primary shadow-xl shadow-primary/5"
                : "bg-muted/10 border-transparent hover:bg-muted/20 hover:border-primary/30"
            }`}
            onClick={() => handleToggleInterest(interest)}
          >
            <div className="pointer-events-none">
              <Checkbox
                checked={selectedInterests.includes(interest)}
                id={interest}
                className="w-6 h-6 rounded-lg border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
            </div>
            <Label
              className="text-lg font-bold cursor-pointer flex-grow group-hover:text-primary transition-colors pointer-events-none"
            >
              {interest}
            </Label>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-6">
        <Button
          type="submit"
          size="lg"
          className="w-full md:w-auto px-12 py-7 text-lg font-bold gradient-btn rounded-2xl shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving Profile...
            </div>
          ) : (
            "Start My First Interview"
          )}
        </Button>
      </div>
    </form>
  );
}
