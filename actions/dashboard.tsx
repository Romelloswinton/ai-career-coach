"use server"

import { db } from "@/app/api/inngest/prisma"
import { auth } from "@clerk/nextjs/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Prisma } from "@prisma/client"

// Define the user type fetched from Prisma
type User = Prisma.UserGetPayload<{
  select: { clerkUserId: true; industry: true; industryInsight: true }
}>

// Define the industry insight type fetched from Prisma
type IndustryInsight = Prisma.IndustryInsightGetPayload<{
  select: {
    id: true
    industry: true
    salaryRanges: true
    growthRate: true
    demandLevel: true
    marketOutlook: true
    topSkills: true
    keyTrends: true
    recommendedSkills: true
    nextUpdate: true
    lastUpdated: true
  }
}>

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

type SalaryRange = {
  role: string
  min: number
  max: number
  median: number
  location: string
}

type DemandLevel = "High" | "Medium" | "Low"
type MarketOutlook = "Positive" | "Neutral" | "Negative"

type IndustryInsights = {
  salaryRanges: SalaryRange[]
  growthRate: number // In percentage
  demandLevel: DemandLevel
  topSkills: string[]
  marketOutlook: MarketOutlook
  keyTrends: string[]
  recommendedSkills: string[]
}

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
})

async function generateAiInsights(industry: string) {
  const prompt = `
  Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
  {
    "salaryRanges": [
      { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
    ],
    "growthRate": number,
    "demandLevel": "High" | "Medium" | "Low",
    "topSkills": ["skill1", "skill2"],
    "marketOutlook": "Positive" | "Neutral" | "Negative",
    "keyTrends": ["trend1", "trend2"],
    "recommendedSkills": ["skill1", "skill2"]
  }
  
  IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
  Include at least 5 common roles for salary ranges.
  Growth rate should be a percentage.
  Include at least 5 skills and trends.
`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = await response.text()
  const cleanedTest = text.replace(/```(?:json)?\n?/g, "").trim()
  return JSON.parse(cleanedTest)
}

export async function getIndustryInsights(): Promise<IndustryInsight> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user: User | null = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      clerkUserId: true,
      industry: true,
      industryInsight: true,
    },
  })

  if (!user) throw new Error("User not found")

  if (!user.industryInsight) {
    if (!user.industry) {
      throw new Error("Industry is not set for the user")
    }

    // Fetch insights if the industry doesn't have insights
    const insights = await generateAiInsights(user.industry)

    const industryInsight = await db.industryInsight.create({
      data: {
        ...insights,
        industry: user.industry,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      },
    })

    return industryInsight
  }

  return user.industryInsight // Return existing insights if they already exist
}
