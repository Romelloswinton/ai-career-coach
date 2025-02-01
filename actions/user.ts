"use server"

import { db } from "@/app/api/inngest/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { generateAIInsights } from "./dashboard"

// Define a type for the expected data format when updating the user
type UserUpdateData = {
  industry: string // Industry field (e.g., 'Technology')
  experience: number | null // Years of experience (nullable)
  bio: string | null // Professional bio (nullable)
  skills: string[] // List of skills
}

// Update the updateUser function's argument to expect `UserUpdateData`
export async function updateUser(data: UserUpdateData) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  })

  if (!user) throw new Error("User not found")

  try {
    // Start a transaction to handle both operations
    const result = await db.$transaction(
      async (tx) => {
        // First check if industry exists
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        })

        // If industry doesn't exist, create it with default values
        if (!industryInsight) {
          const insights = await generateAIInsights(data.industry)

          industryInsight = await db.industryInsight.create({
            data: {
              industry: data.industry,
              ...insights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          })
        }

        // Now update the user
        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        })

        return { updatedUser, industryInsight }
      },
      {
        timeout: 50000, // default: 5000
      }
    )

    revalidatePath("/")
    return { ...result }
  } catch (error: any) {
    console.error("Error updating user and industry:", error.message)
    throw new Error("Failed to update profile")
  }
}

type OnboardingStatus = {
  isOnboarded: boolean
}

// Update the getUserOnboardingStatus function's return type
export async function getUserOnboardingStatus(): Promise<OnboardingStatus> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  })

  if (!user) throw new Error("User not found")

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    })

    return {
      isOnboarded: !!user?.industry, // Check if industry exists
    }
  } catch (error: any) {
    console.error("Error checking onboarding status:", error)
    throw new Error("Failed to check onboarding status")
  }
}
