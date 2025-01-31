import { PrismaClient } from "@prisma/client"

export const db = globalThis.prisma || new PrismaClient()

// Extending the global namespace to include 'prisma'
declare global {
  var prisma: PrismaClient // No need for an index signature
}

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db
}
