"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User as UserIcon, Settings, Bell, Moon, Sun, Monitor, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "@/lib/actions/auth.action";
import { updateProfile, getUserStats } from "@/lib/actions/user.action";
import { Checkbox } from "@/components/ui/checkbox";

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

export function UserAvatar({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<{ interviewCount: number; joinedAt: Date } | null>(null);
  const [formData, setFormData] = useState({
    name: user.name || "",
    interests: user.interests || [],
    receiveEmailNotifications: user.receiveEmailNotifications ?? true,
  });

  const { setTheme, theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      getUserStats().then(setStats as any);
    }
  }, [open]);

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
    router.push("/sign-in");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success("Profile updated successfully!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const firstLetter = user.name?.charAt(0).toUpperCase() || "U";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
          <Avatar className="border-2 border-primary/20 shadow-lg h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {firstLetter}
            </AvatarFallback>
          </Avatar>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto rounded-[32px] border border-white/10 !bg-background/95 backdrop-blur-2xl shadow-2xl p-0">
        <div className="p-8 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-3 gradient-text">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              Account Settings
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full mt-4">
            <TabsList className="grid grid-cols-3 bg-muted/30 rounded-2xl p-1.5 mb-8">
              <TabsTrigger value="profile" className="rounded-xl gap-2 font-semibold">
                <UserIcon className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-xl gap-2 font-semibold">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" className="rounded-xl gap-2 font-semibold">
                <Monitor className="w-4 h-4" />
                Appearance
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="profile" className="space-y-8 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10">
                    <p className="text-4xl font-black text-primary">{stats?.interviewCount || 0}</p>
                    <p className="text-[10px] uppercase font-bold text-foreground/60 dark:text-muted-foreground tracking-widest mt-1">Interviews Taken</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10 transition-all hover:bg-secondary/10">
                    <p className="text-lg font-black text-primary">{stats?.joinedAt ? new Date(stats.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "---"}</p>
                    <p className="text-[10px] uppercase font-bold text-foreground/60 dark:text-muted-foreground tracking-widest mt-1">Member Since</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-foreground/70 dark:text-muted-foreground ml-1">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-card/30 rounded-2xl border-foreground/10 dark:border-white/10 h-14 text-lg focus:ring-primary/20"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground/70 dark:text-muted-foreground ml-1">Interests & Focus Areas</Label>
                    <div className="grid grid-cols-3 gap-3 p-3 border border-foreground/5 dark:border-white/5 rounded-[24px] bg-muted/10">
                      {interestsOptions.map((interest) => (
                        <div
                          key={interest}
                          className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all border ${
                            formData.interests.includes(interest)
                              ? "bg-primary/10 border-primary shadow-sm"
                              : "bg-transparent border-transparent hover:bg-white/5"
                          }`}
                          onClick={() => handleToggleInterest(interest)}
                        >
                          <Checkbox
                            checked={formData.interests.includes(interest)}
                            onCheckedChange={() => handleToggleInterest(interest)}
                            className="rounded-md"
                          />
                          <span className="text-sm font-medium">{interest}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6 py-4 animate-in fade-in duration-200">
                <div className="group flex items-center justify-between p-6 rounded-3xl border border-foreground/5 dark:border-white/5 bg-muted/10 hover:bg-muted/20 transition-all">
                  <div className="space-y-1">
                    <p className="font-bold text-lg">Email Notifications</p>
                    <p className="text-sm text-foreground/70 dark:text-muted-foreground">Receive detailed feedback analysis after every mock interview</p>
                  </div>
                  <Switch
                    checked={formData.receiveEmailNotifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, receiveEmailNotifications: checked })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6 py-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'system', icon: Monitor, label: 'System' }
                  ].map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="outline"
                      className={`flex flex-col gap-3 h-32 rounded-3xl border-2 transition-all ${
                        theme === item.id 
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                        : "border-foreground/5 dark:border-white/5 bg-muted/5 hover:bg-muted/10"
                      }`}
                      onClick={() => setTheme(item.id)}
                    >
                      <item.icon className={`h-8 w-8 ${theme === item.id ? "text-primary" : "text-foreground/60 dark:text-muted-foreground"}`} />
                      <span className="font-bold text-sm">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <div className="flex items-center justify-between pt-8 mt-8 border-t border-foreground/5 dark:border-white/5">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold transition-colors"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-2xl px-6 font-bold"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl px-10 h-12 gradient-btn font-black text-lg shadow-xl"
                  >
                    {isSubmitting ? "Saving..." : "Apply Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
