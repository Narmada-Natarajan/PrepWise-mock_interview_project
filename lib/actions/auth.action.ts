"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import UserModel from "@/lib/models/User";
import Session from "@/lib/models/Session";
import { sendEmail } from "@/lib/mail";
import { getOTPTemplate, getResetPasswordTemplate } from "@/lib/templates/email-template";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeEmail,
  verifyPassword,
} from "@/lib/session";

const SESSION_DURATION = 60 * 60 * 24 * 7;
const SESSION_COOKIE_NAME = "session";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const name = params.name.trim();
  const email = normalizeEmail(params.email);
  const password = params.password;

  try {
    await dbConnect();
    const existingUser = await UserModel.findOne({ email });
    
    if (existingUser) {
      if (existingUser.isVerified) {
        return {
          success: false,
          message: "User already exists. Please sign in.",
        };
      }
      // If user exists but not verified, update their record and send new OTP
      const otp = generateOTP();
      existingUser.name = name;
      existingUser.passwordHash = hashPassword(password);
      existingUser.verificationCode = otp;
      existingUser.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await existingUser.save();

      await sendEmail({
        to: email,
        subject: "Verify your PrepWise Account",
        html: getOTPTemplate(name, otp),
      });

      return {
        success: true,
        message: "A new verification code has been sent to your email.",
        requireVerification: true,
      };
    }

    const otp = generateOTP();
    await UserModel.create({
      name,
      email,
      passwordHash: hashPassword(password),
      verificationCode: otp,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });

    await sendEmail({
      to: email,
      subject: "Verify your PrepWise Account",
      html: getOTPTemplate(name, otp),
    });

    return {
      success: true,
      message: "Verification code sent to your email.",
      requireVerification: true,
    };
  } catch (error) {
    console.error("Error creating user:", error);

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function verifyOTP(params: VerifyOTPParams) {
  const { email, otp } = params;

  try {
    await dbConnect();
    const user = await UserModel.findOne({ email, verificationCode: otp });

    if (!user) {
      return { success: false, message: "Invalid verification code." };
    }

    if (user.verificationCodeExpires < new Date()) {
      return { success: false, message: "Verification code has expired." };
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    return { success: true, message: "Account verified successfully. You can now sign in." };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: "Failed to verify. Please try again." };
  }
}

export async function resendOTP(email: string) {
  try {
    await dbConnect();
    const user = await UserModel.findOne({ email });

    if (!user || user.isVerified) {
      return { success: false, message: "User not found or already verified." };
    }

    const otp = generateOTP();
    user.verificationCode = otp;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await sendEmail({
      to: email,
      subject: "Your New Verification Code",
      html: getOTPTemplate(user.name, otp),
    });

    return { success: true, message: "New verification code sent." };
  } catch (error) {
    console.error("Error resending OTP:", error);
    return { success: false, message: "Failed to resend code." };
  }
}

export async function signIn(params: SignInParams) {
  const email = normalizeEmail(params.email);

  try {
    await dbConnect();
    const user = await UserModel.findOne({ email });

    if (!user || !verifyPassword(params.password, user.passwordHash)) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    if (!user.isVerified) {
      return {
        success: false,
        message: "Please verify your email before signing in.",
        requireVerification: true,
      };
    }

    const sessionToken = createSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = Date.now() + SESSION_DURATION * 1000;

    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    await setSessionCookie(sessionToken);
    
    return {
      success: true,
      message: "Signed in successfully.",
      isOnboarded: !!user.isOnboarded,
    };
  } catch (error) {
    console.error("Failed to sign in:", error);

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

export async function forgotPassword(params: ForgotPasswordParams) {
  const email = normalizeEmail(params.email);

  try {
    await dbConnect();
    const user = await UserModel.findOne({ email });

    if (!user) {
      // Don't reveal user existence for security, but we'll return success to avoid metadata leak
      // In this specific case, for UX we might tell them but standard is to be vague.
      // However, if the user "Forgot password", they know they have an account.
      return { success: true, message: "If an account exists, a reset code was sent." };
    }

    const otp = generateOTP();
    user.resetPasswordCode = otp;
    user.resetPasswordCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    await sendEmail({
      to: email,
      subject: "Reset your Password",
      html: getResetPasswordTemplate(user.name, otp),
    });

    return { success: true, message: "Reset code sent to your email." };
  } catch (error) {
    console.error("Error in forgot password:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

export async function resetPassword(params: ResetPasswordParams) {
  const { email, otp, password } = params;

  if (password.new !== password.confirm) {
    return { success: false, message: "Passwords do not match." };
  }

  try {
    await dbConnect();
    const user = await UserModel.findOne({ email, resetPasswordCode: otp });

    if (!user) {
      return { success: false, message: "Invalid reset code." };
    }

    if (user.resetPasswordCodeExpires < new Date()) {
      return { success: false, message: "Reset code has expired." };
    }

    user.passwordHash = hashPassword(password.new);
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    await user.save();

    return { success: true, message: "Password reset successful. You can now sign in." };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, message: "Failed to reset password. Please try again." };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    try {
      await dbConnect();
      await Session.deleteOne({
        tokenHash: hashSessionToken(sessionToken),
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  try {
    await dbConnect();
    const session = await Session.findOne({
      tokenHash: hashSessionToken(sessionToken),
    }).populate("userId");

    if (!session || session.expiresAt <= Date.now()) {
      return null;
    }

    const user = session.userId;

    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      interests: user.interests,
      isOnboarded: user.isOnboarded,
      receiveEmailNotifications: user.receiveEmailNotifications,
    } as User;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

