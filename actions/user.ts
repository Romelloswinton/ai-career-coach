"use server"

import { db } from "@/app/api/inngest/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

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
          industryInsight = await tx.industryInsight.create({
            data: {
              industry: data.industry,
              salaryRanges: [],
              growthRate: 0,
              demandLevel: "MEDIUM",
              topSkills: [],
              marketOutlook: "NEUTRAL",
              keyTrends: [],
              recommendedSkills: [],
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
        timeout: 10000, // Default timeout (10 seconds)
      }
    )

    // Revalidate the path after updating the user
    revalidatePath("/")
    return { success: true, ...result } // Return the updated user
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
