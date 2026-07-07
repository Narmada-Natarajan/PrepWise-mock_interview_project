"use client";

import { z } from "zod";
import Image from "next/image";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import {
  signIn,
  signUp,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
} from "@/lib/actions/auth.action";
import FormField from "./FormField";

type AuthView = "sign-in" | "sign-up" | "verify" | "forgot" | "reset";

const authFormSchema = (view: AuthView) => {
  return z.object({
    name: view === "sign-up" ? z.string().min(3, "Name must be at least 3 characters") : z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: (view === "sign-up" || view === "sign-in") ? z.string().min(3, "Password must be at least 3 characters") : z.string().optional(),
    otp: (view === "verify" || view === "reset") ? z.string().length(6, "OTP must be 6 digits") : z.string().optional(),
    newPassword: view === "reset" ? z.string().min(3, "Password must be at least 3 characters") : z.string().optional(),
    confirmPassword: view === "reset" ? z.string().min(3, "Password must be at least 3 characters") : z.string().optional(),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [view, setView] = useState<AuthView>(type === "sign-in" ? "sign-in" : "sign-up");
  const [loading, setLoading] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");

  const formSchema = authFormSchema(view);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (view === "sign-up") {
        const result = await signUp({
          name: data.name!,
          email: data.email,
          password: data.password!,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        if (result.requireVerification) {
          setEmailForVerification(data.email);
          setView("verify");
          toast.success(result.message);
        } else {
          toast.success("Account created successfully. Please sign in.");
          setView("sign-in");
        }
      } else if (view === "sign-in") {
        const result = await signIn({
          email: data.email,
          password: data.password!,
        });

        if (!result.success) {
          if (result.requireVerification) {
            setEmailForVerification(data.email);
            setView("verify");
          }
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        if (result.isOnboarded) {
          router.push("/");
        } else {
          router.push("/onboarding");
        }
      } else if (view === "verify") {
        const result = await verifyOTP({
          email: emailForVerification || data.email,
          otp: data.otp || "",
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        setView("sign-in");
      } else if (view === "forgot") {
        const result = await forgotPassword({ email: data.email });
        if (result.success) {
          setEmailForVerification(data.email);
          setView("reset");
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } else if (view === "reset") {
        const result = await resetPassword({
          email: emailForVerification || data.email,
          otp: data.otp!,
          password: {
            new: data.newPassword!,
            confirm: data.confirmPassword!,
          },
        });

        if (result.success) {
          toast.success(result.message);
          setView("sign-in");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("There was an unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    const email = emailForVerification || form.getValues("email");
    if (!email) {
      toast.error("Email is required to resend OTP.");
      return;
    }
    const result = await resendOTP(email);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const renderTitle = () => {
    switch (view) {
      case "sign-in": return "Sign In";
      case "sign-up": return "Create an Account";
      case "verify": return "Verify your Email";
      case "forgot": return "Forgot Password";
      case "reset": return "Reset Password";
      default: return "";
    }
  };

  const renderSubtitle = () => {
    switch (view) {
      case "sign-in":
      case "sign-up": return "Practice job interviews with AI";
      case "verify": return `We sent a 6-digit code to ${emailForVerification || "your email"}`;
      case "forgot": return "Enter your email to receive a reset code";
      case "reset": return "Enter the 6-digit code and your new password";
      default: return "";
    }
  };

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </div>

        <div className="text-center space-y-2">
          <h3>{renderTitle()}</h3>
          <p className="text-gray-400">{renderSubtitle()}</p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {view === "sign-up" && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            {(view === "sign-in" || view === "sign-up" || view === "forgot") && (
              <FormField
                control={form.control}
                name="email"
                label="Email"
                placeholder="Your email address"
                type="email"
              />
            )}

            {(view === "sign-in" || view === "sign-up") && (
              <div className="space-y-1">
                <FormField
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                />
                {view === "sign-in" && (
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-sm text-primary hover:underline float-right"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {(view === "verify" || view === "reset") && (
              <FormField
                control={form.control}
                name="otp"
                label="Verification Code"
                placeholder="6-digit code"
                type="text"
              />
            )}

            {view === "reset" && (
              <>
                <FormField
                  control={form.control}
                  name="newPassword"
                  label="New Password"
                  placeholder="New password"
                  type="password"
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  type="password"
                />
              </>
            )}

            <div className="flex flex-col gap-4">
              <Button className="btn" type="submit" disabled={loading}>
                {loading ? "Processing..." : (
                  view === "sign-in" ? "Sign In" :
                  view === "sign-up" ? "Create an Account" :
                  view === "verify" ? "Verify Code" :
                  view === "forgot" ? "Send Reset Code" : "Update Password"
                )}
              </Button>

              {view === "verify" && (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Didn't receive a code? Resend
                </button>
              )}
            </div>
          </form>
        </Form>

        {(view === "sign-in" || view === "sign-up") && (
          <p className="text-center">
            {view === "sign-in" ? "No account yet?" : "Have an account already?"}
            <button
              onClick={() => setView(view === "sign-in" ? "sign-up" : "sign-in")}
              className="font-bold text-primary ml-1 hover:underline"
            >
              {view === "sign-in" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        )}

        {view !== "sign-in" && view !== "sign-up" && (
          <button
            onClick={() => setView("sign-in")}
            className="text-center text-sm text-gray-500 hover:text-primary hover:underline"
          >
            ← Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
