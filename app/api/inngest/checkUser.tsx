import { currentUser } from "@clerk/nextjs/server"
import React from "react"
import { db } from "./prisma"

type Props = {}

const checkUser = async () => {
  const user = await currentUser()

  if (!user) {
    return null
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    })

    if (loggedInUser) {
      return loggedInUser
    }

    const name = `${user.firstName} ${user.lastName}`

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        updatedAt: new Date(),
      },
    })

    return newUser
  } catch (error: any) {
    console.log(error.message)
  }
}

export default checkUser
