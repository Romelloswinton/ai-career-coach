import { industries } from "@/app/data/industries"
import React from "react"
import OnboardingForm from "./_components/onboarding-form"
import { getUserOnboardingStatus } from "@/actions/user"
import { redirect } from "next/navigation"

type Props = {}

const OnboardingPage = async () => {
  // Check if user is already onboarded

  const { isOnboarded } = await getUserOnboardingStatus()

  if (isOnboarded) {
    redirect("/dashboard")
  }

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  )
}

export default OnboardingPage
