import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  // If not logged in, redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  // If already onboarded, redirect to home
  if (user.isOnboarded) {
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-12 md:p-24 bg-background relative overflow-hidden">
      {/* Decorative background elements for premium feel */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-secondary/20 blur-[150px] rounded-full animate-pulse" />
      </div>

      <div className="w-full max-w-4xl p-10 space-y-12 glassmorphism card relative z-10 border border-white/5 shadow-2xl backdrop-blur-xl rounded-[40px]">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-wide uppercase">
            Let's Personalize Your Journey
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
            Welcome to <span className="gradient-text">PrepWise</span>
          </h1>
          
          <p className="text-muted-foreground text-xl leading-relaxed">
            Choose your core focus areas so we can tailor our AI mock interviews to your goals.
          </p>
        </div>

        <div className="w-full">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
