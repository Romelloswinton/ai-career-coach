import { getIndustryInsights } from "@/actions/dashboard"
import { getUserOnboardingStatus } from "@/actions/user"
import { redirect } from "next/navigation"
import React from "react"
import DashboardView from "./_components/DashboardView"

// Define the SalaryRange type
type SalaryRange = {
  role: string
  min: number
  max: number
  median: number
  location: string
}

// Define the types to match DashboardView's expectations
type DemandLevel = "HIGH" | "MEDIUM" | "LOW"
export type MarketOutlook = "POSITIVE" | "NEUTRAL" | "NEGATIVE"

// Define the type for industry insights matching DashboardView's expected props
type DashboardInsights = {
  id: string
  industry: string
  salaryRanges: SalaryRange[]
  growthRate: number
  demandLevel: DemandLevel
  topSkills: string[]
  marketOutlook: MarketOutlook
  keyTrends: string[]
  recommendedSkills: string[]
  lastUpdated: string
  nextUpdate: string
}

// Type guard to check if a value is a SalaryRange
function isSalaryRange(value: unknown): value is SalaryRange {
  if (!value || typeof value !== "object") return false
  const v = value as any
  return (
    typeof v.role === "string" &&
    typeof v.min === "number" &&
    typeof v.max === "number" &&
    typeof v.median === "number" &&
    typeof v.location === "string"
  )
}

const IndustryInsightsPage = async () => {
  const { isOnboarded } = await getUserOnboardingStatus()

  // Get the raw data first
  const rawData = await getIndustryInsights()

  // Transform the data to match DashboardView's expected types
  const insights: DashboardInsights = {
    ...rawData,
    salaryRanges: Array.isArray(rawData.salaryRanges)
      ? rawData.salaryRanges.filter(isSalaryRange)
      : [],
    // Ensure string types for dates
    lastUpdated: rawData.lastUpdated.toString(),
    nextUpdate: rawData.nextUpdate.toString(),
    // Ensure the marketOutlook value is one of the expected literal types
    marketOutlook: rawData.marketOutlook as MarketOutlook,
    demandLevel: rawData.demandLevel as DemandLevel,
  }

  if (!isOnboarded) {
    redirect("/onboarding")
  }

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} />
    </div>
  )
}

export default IndustryInsightsPage
