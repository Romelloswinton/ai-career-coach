import { Prisma } from "@prisma/client"
import { create } from "zustand"

export type User = Prisma.UserGetPayload<{
  select: { clerkUserId: true; industry: true; industryInsight: true }
}>

// Define the industry insight type fetched from Prisma
export type IndustryInsight = Prisma.IndustryInsightGetPayload<{
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
export type SalaryRange = {
  role: string
  min: number
  max: number
  median: number
  location: string
}

export type DemandLevel = "HIGH" | "MEDIUM" | "LOW"
export type MarketOutlook = "POSITIVE" | "NEUTRAL" | "NEGATIVE"

export type IndustryInsights = {
  salaryRanges: SalaryRange[]
  growthRate: number // In percentage
  demandLevel: DemandLevel
  topSkills: string[]
  marketOutlook: MarketOutlook
  keyTrends: string[]
  recommendedSkills: string[]
}
