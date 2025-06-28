"use client"

import { useState, useEffect, useCallback } from "react"
import { SupabaseRealtimeService, type Participant } from "@/lib/supabase-realtime"

export function useRealtimeParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">(
    "disconnected",
  )
  const [lastUpdated, setLastUpdated] = useState<string>("")

  // Handle participant updates
  const handleParticipantUpdate = useCallback((newParticipants: Participant[]) => {
    console.log("🔄 HOOK: Received participant update:", newParticipants.length)
    setParticipants(newParticipants)
    setLastUpdated(new Date().toISOString())
    setIsLoading(false)
  }, [])

  // Handle status updates
  const handleStatusUpdate = useCallback((status: typeof connectionStatus) => {
    console.log("📡 HOOK: Connection status:", status)
    setConnectionStatus(status)
  }, [])

  // Load initial data
  const loadParticipants = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await SupabaseRealtimeService.getAllParticipants()
      setParticipants(data)
      setLastUpdated(new Date().toISOString())
    } catch (error) {
      console.error("❌ HOOK: Error loading participants:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh data manually
  const refresh = useCallback(() => {
    loadParticipants()
  }, [loadParticipants])

  useEffect(() => {
    // Load initial data
    loadParticipants()

    // Setup real-time listeners
    SupabaseRealtimeService.addParticipantListener(handleParticipantUpdate)
    SupabaseRealtimeService.addStatusListener(handleStatusUpdate)

    // Cleanup on unmount
    return () => {
      SupabaseRealtimeService.removeParticipantListener(handleParticipantUpdate)
      SupabaseRealtimeService.removeStatusListener(handleStatusUpdate)
    }
  }, [loadParticipants, handleParticipantUpdate, handleStatusUpdate])

  return {
    participants,
    isLoading,
    connectionStatus,
    lastUpdated,
    refresh,
    // Service methods
    addParticipant: SupabaseRealtimeService.addParticipant,
    updateParticipant: SupabaseRealtimeService.updateParticipant,
    deleteParticipant: SupabaseRealtimeService.deleteParticipant,
    findByCertificateNumber: SupabaseRealtimeService.findByCertificateNumber,
  }
}
