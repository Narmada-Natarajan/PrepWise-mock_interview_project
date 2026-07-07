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
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground text-center">Create Interview Model</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="grid text-foreground w-full items-center gap-1.5">
              <Label htmlFor="role" className="text-foreground font-semibold">Role / Job Title</Label>
              <Input
                id="role"
                placeholder="e.g. Frontend Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid w-full text-foreground items-center gap-1.5">
              <Label htmlFor="description" className="text-foreground font-semibold">Description</Label>
              <textarea
                id="description"
                placeholder="Explain the focus of this interview..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all custom-scrollbar"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic" className="text-foreground text-base font-semibold">Public Access</Label>
                <p className="text-sm text-muted-foreground font-medium">
                  {formData.isPublic 
                    ? "Show to other users" 
                    : "Only you can see this"}
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all h-12 text-lg font-bold rounded-full shadow-lg shadow-primary/20"
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
