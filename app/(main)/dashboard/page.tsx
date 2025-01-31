import { getUserOnboardingStatus } from "@/actions/user"
import { redirect } from "next/navigation"
import React from "react"

type Props = {}

const IndustryInsightsPage = async () => {
  const { isOnboarded } = await getUserOnboardingStatus()

  if (!isOnboarded) {
    redirect("/onboarding")
  }

  return <div>IndustryInsightsPage</div>
}

export default IndustryInsightsPage
