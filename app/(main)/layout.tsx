import React from "react"

type Props = {
  children: React.ReactNode
}

const MainLayout = ({ children }: Props) => {
  // Redirect to onboarding
  return <div className="container mx-auto mt-24 mb-20">{children}</div>
}

export default MainLayout
