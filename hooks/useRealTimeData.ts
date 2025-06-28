"use client"

import { useState, useEffect, useCallback } from "react"

interface UseRealTimeDataOptions {
  endpoint: string
  interval?: number
}

export function useRealTimeData<T>(options: UseRealTimeDataOptions) {
  const { endpoint, interval = 2000 } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
      setError(null)
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      console.error("Error fetching data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [endpoint])

  const refetch = useCallback(() => {
    setIsLoading(true)
    fetchData()
  }, [fetchData])

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up polling
    const intervalId = setInterval(fetchData, interval)

    return () => clearInterval(intervalId)
  }, [fetchData, interval])

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch,
  }
}
