import { getAssessments } from "@/actions/interview"
import React from "react"
import StatsCard from "./_components/stats-card"
import PerformanceChart from "./_components/performance-chart"
import QuizList from "./_components/quiz-list"

type Props = {}

type Assessment = {
  userId: string
  quizScore: number
  questions: QuestionResult[]
  category: string
  improvementTip?: string | null
  createdAt: Date
}

type QuestionResult = {
  question: string
  answer: string
  userAnswer: string
  isCorrect: boolean
  explanation: string
}

const InterviewPage = async () => {
  const assesments = await getAssessments()

  return (
    <div>
      <div>
        <h1 className="text-6xl font-bold gradient-title mb-5">
          Interview Preparation
        </h1>
        <div>
          <StatsCard assessments={assesments} />
          <PerformanceChart assessments={assesments} />
          <QuizList assessments={assesments} />
        </div>
      </div>
    </div>
  )
}

export default InterviewPage
