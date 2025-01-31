import { Button } from "@/components/ui/button"
import Link from "next/link"
import React from "react"

type Props = {}

const NotFound = (props: Props) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] px-4">
      <h1 className="text-6xl font-bold gradient-title mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4"></h2>
      <p className="text-gray-600 mb-8">
        Oops! The you're looking for doesn't exist of has been moved.
      </p>
      <Link href={"/"}>
        <Button>Return Home</Button>
      </Link>
    </div>
  )
}

export default NotFound
