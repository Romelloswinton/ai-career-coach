import { useState } from "react"
import { toast } from "sonner"

// Type for the callback function (cb)
type CallbackFunction<T> = (...args: any[]) => Promise<T>

// Generic hook type
type UseFetchReturn<T> = {
  data: T | undefined
  loading: boolean
  error: Error | null
  fn: (...args: any[]) => Promise<void>
  setData: React.Dispatch<React.SetStateAction<T | undefined>>
}

const useFetch = <T>(cb: CallbackFunction<T>): UseFetchReturn<T> => {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fn = async (...args: any[]) => {
    setLoading(true)
    setError(null)

    try {
      const response = await cb(...args)
      setData(response)
      setError(null)
    } catch (error: any) {
      setError(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fn, setData }
}

export default useFetch
