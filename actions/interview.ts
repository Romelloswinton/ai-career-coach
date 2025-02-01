"use server"

import { db } from "@/app/api/inngest/prisma"
import { auth } from "@clerk/nextjs/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// These are like blueprints that define the structure of your data
type Question = {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

type Assessment = {
  userId: string
  quizScore: number
  questions: QuestionResult[]
  category: string
  improvementTip?: string | null
}

type QuizResponse = {
  questions: Question[]
}

type QuestionResult = {
  question: string
  answer: string
  userAnswer: string
  isCorrect: boolean
  explanation: string
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export async function generateQuiz(): Promise<Question[]> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  })

  if (!user) throw new Error("User not found")

  const prompt = `
    Generate 10 technical interview questions for a ${user.industry}
    professional${
      user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
    }.
    
    Each question should be multiple choice with 4 options.
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim()
    const quiz: QuizResponse = JSON.parse(cleanedText)

    return quiz.questions
  } catch (error) {
    console.error("Error generating quiz:", error)
    throw new Error("Failed to generate quiz questions")
  }
}

export async function saveQuizResult(
  questions: Question[],
  answers: string[],
  score: number
): Promise<Assessment> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  })

  if (!user) throw new Error("User not found")

  const questionResults: QuestionResult[] = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }))

  const assessmentQuestions = questionResults.map((result) => ({
    question: result.question,
    answer: result.answer,
    userAnswer: result.userAnswer,
    isCorrect: result.isCorrect,
    explanation: result.explanation,
  }))

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect)

  // Only generate improvement tips if there are wrong answers
  let improvementTip: string | null = null
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n")

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `

    try {
      const tipResult = await model.generateContent(improvementPrompt)
      improvementTip = tipResult.response.text().trim()
    } catch (error) {
      console.error("Error generating improvement tip:", error)
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: assessmentQuestions,
        category: "Technical",
        improvementTip: improvementTip ?? "",
      },
    })

    return {
      ...assessment,
      questions: questionResults, // Convert back to structured data when returning
    }
  } catch (error) {
    console.error("Error saving quiz result:", error)
    throw new Error("Failed to save quiz result")
  }
}

// The getAssessments function Promise to return an array of assessments
export async function getAssessments(): Promise<Assessment[]> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  })

  if (!user) throw new Error("User not found")

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return assessments.map((assessment) => ({
      ...assessment,
      questions: assessment.questions as QuestionResult[], // Explicitly casting
    }))
  } catch (error) {
    console.error("Error fetching assessments:", error)
    throw new Error("Failed to fetch assessments")
  }
}
