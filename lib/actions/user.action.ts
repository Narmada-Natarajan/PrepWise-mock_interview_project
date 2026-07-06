"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "./auth.action";

export async function updateProfile(data: { name: string; interests: string[]; receiveEmailNotifications: boolean }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await dbConnect();
    await User.findByIdAndUpdate(user.id, {
      name: data.name,
      interests: data.interests,
      receiveEmailNotifications: data.receiveEmailNotifications,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Failed to update profile" };
  }
}

export async function getUserStats() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const [interviewModel, User] = await Promise.all([
      import("@/lib/models/Interview"),
      import("@/lib/models/User"),
    ]);

    await dbConnect();
    const count = await interviewModel.default.countDocuments({ userId: user.id });
    const userData = await User.default.findById(user.id).select("createdAt");

    return {
      interviewCount: count,
      joinedAt: userData?.createdAt || new Date(),
    };
  } catch (error) {
    console.error("Get user stats error:", error);
    return null;
  }
}

export async function updateUserNotifications(receiveEmailNotifications: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await dbConnect();
    await User.findByIdAndUpdate(user.id, { receiveEmailNotifications });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Update notifications error:", error);
    return { success: false };
  }
}
