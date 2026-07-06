"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createInterview, generateInterviewQuestions } from "@/lib/actions/general.action";
import { Plus } from "lucide-react";

const CreateInterviewModal = ({ userId }: { userId: string | undefined }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    description: "",
    isPublic: true,
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Please login to create an interview.");
    if (!formData.role) return toast.error("Please enter a role.");

    setLoading(true);
    try {
      // 1. Generate questions for this model
      const qRes = await generateInterviewQuestions({
        jd: formData.role,
        description: formData.description,
        language: "English",
        level: "Mid-Level", // Default level for templates
      });

      if (!qRes.success || !qRes.questions) {
        throw new Error("Failed to generate questions");
      }

      // 2. Create the interview record
      const res = await createInterview({
        userId,
        role: formData.role,
        description: formData.description,
        isPublic: formData.isPublic,
        type: "Technical", // Default type
        level: "Mid-Level",
        questions: qRes.questions,
        techstack: [],
        finalized: true, // It's a template, so mark as finalized
      });

      if (res.success) {
        toast.success("Interview model created successfully!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to create interview.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary flex items-center gap-2">
          <Plus className="size-5" />
          <span>Create Model</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white border-2 border-black shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black text-center">Create Interview Model</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="grid text-black w-full items-center gap-1.5">
              <Label htmlFor="role" className="text-black font-semibold">Role / Job Title</Label>
              <Input
                id="role"
                placeholder="e.g. Frontend Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="border-black text-black placeholder:text-gray-500"
              />
            </div>
            <div className="grid w-full text-black items-center gap-1.5">
              <Label htmlFor="description" className="text-black font-semibold">Description</Label>
              <textarea
                id="description"
                placeholder="Explain the focus of this interview..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] border-black border-2 w-full rounded-md border-input bg-white px-3 py-2 text-sm text-black ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex items-center justify-between p-4 border-2 border-black rounded-lg bg-gray-50/50">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic" className="text-black text-base font-semibold">Public Access</Label>
                <p className="text-sm text-gray-600 font-medium">
                  {formData.isPublic 
                    ? "Show to other users" 
                    : "Only you can see this"}
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                className="data-[state=checked]:bg-primary-200 data-[state=unchecked]:bg-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white hover:bg-gray-800 transition-all h-12 text-lg font-bold rounded-full"
            >
              {loading ? "Creating..." : "Create Interview Model"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInterviewModal;
