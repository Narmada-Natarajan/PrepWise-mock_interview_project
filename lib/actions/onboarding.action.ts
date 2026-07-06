"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import UserModel from "@/lib/models/User";
import { getCurrentUser } from "./auth.action";

export async function completeOnboarding(interests: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "User not authenticated." };
    }

    await dbConnect();
    await UserModel.findByIdAndUpdate(user.id, {
      interests,
      isOnboarded: true,
    });

    revalidatePath("/", "layout");
    return { success: true, message: "Welcome to PrepWise!" };
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return { success: false, message: "Failed to save your preferences. Please try again." };
  }
}
