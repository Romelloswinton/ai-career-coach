"use client"

import { generateQuiz, saveQuizResult } from "@/actions/interview"
import useFetch from "@/app/hooks/use-fetch"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import React, { useEffect, useState } from "react"
import { BarLoader } from "react-spinners"
import { toast } from "sonner"
import QuizResult from "./quiz-result"

// Match the server-side types
type Question = {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

type QuestionResult = {
  question: string
  answer: string
  userAnswer: string
  isCorrect: boolean
  explanation: string
}

type Assessment = {
  userId: string
  quizScore: number
  questions: QuestionResult[]
  category: string
  improvementTip?: string | null
}

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [showExplanation, setShowExplanation] = useState<boolean>(false)
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false)
  const [score, setScore] = useState<number>(0)

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch<Question[]>(generateQuiz)

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch<Assessment>(saveQuizResult)

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null))
    }
  }, [quizData])

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (quizData && currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setShowExplanation(false)
    } else {
      finishQuiz()
    }
  }

  const calculateScore = (): number => {
    let correct = 0

    if (!quizData) {
      console.error("Quiz Data not available")
      return 0
    }

    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++
      }
    })
    return (correct / quizData.length) * 100
  }

  const finishQuiz = async () => {
    const calculatedScore = calculateScore()

    if (!quizData || quizData.length === 0) {
      toast.error("Quiz data is not available")
      return
    }

    const filteredAnswers = answers.filter(
      (answer) => answer !== null
    ) as string[]

    if (filteredAnswers.length !== quizData.length) {
      toast.error("Not all questions have been answered.")
      return
    }

    try {
      // Save quiz result using server action and wait for the response
      await saveQuizResultFn(quizData, filteredAnswers, calculatedScore)
      toast.success("Quiz completed!")
      setScore(calculatedScore)
      setIsQuizFinished(true)
    } catch (error) {
      console.error("Error saving quiz result:", error)
      toast.error("Failed to save quiz results.")
    }
  }

  const startNewQuiz = () => {
    setCurrentQuestion(0)
    setAnswers([])
    setShowExplanation(false)
    generateQuizFn()
    setResultData(undefined)
  }

  if (generatingQuiz) {
    return <BarLoader className="mt-4" width={"100%"} color="gray" />
  }

  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    )
  }

  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions specific to your industry and
            skills. Take your time and choose the best answer for each question.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generateQuizFn} className="w-full">
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const question = quizData[currentQuestion]
  if (!question) return null

  return (
    <div>
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>
            Question {currentQuestion + 1} of {quizData.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{question.question}</p>
          <RadioGroup
            className="space-y-2"
            onValueChange={handleAnswer}
            value={answers[currentQuestion] ?? undefined}
          >
            {question.options.map((option, index) => (
              <div className="flex items-center space-x-2" key={index}>
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
          {showExplanation && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="font-medium">Explanation:</p>
              <p className="text-muted-foreground">{question.explanation}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!showExplanation && (
            <Button
              onClick={() => setShowExplanation(true)}
              variant="outline"
              disabled={!answers[currentQuestion]}
            >
              Show Explanation
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="ml-auto"
            disabled={!answers[currentQuestion] || savingResult}
          >
            {savingResult && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentQuestion < quizData.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Quiz
