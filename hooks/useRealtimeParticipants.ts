"use client"

import { useState, useEffect, useCallback } from "react"
import { SupabaseRealtimeService, type Participant } from "@/lib/supabase-realtime"

export function useRealtimeParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">(
    "disconnected",
  )
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Handle participant updates
  const handleParticipantUpdate = useCallback((newParticipants: Participant[]) => {
    console.log("🔄 HOOK: Received participant update:", newParticipants.length)
    setParticipants(newParticipants)
    setLastUpdated(new Date().toISOString())
    setIsLoading(false)
  }, [])

  // Handle status updates
  const handleStatusUpdate = useCallback((status: typeof connectionStatus) => {
    console.log("📡 HOOK: Connection status changed:", status)
    setConnectionStatus(status)
  }, [])

  // Initialize and setup listeners
  useEffect(() => {
    let mounted = true

    const initializeData = async () => {
      if (!mounted) return

      try {
        setIsLoading(true)
        console.log("🚀 HOOK: Initializing real-time participants...")

        // Setup listeners
        SupabaseRealtimeService.addParticipantListener(handleParticipantUpdate)
        SupabaseRealtimeService.addStatusListener(handleStatusUpdate)

        // Get initial data
        const initialParticipants = await SupabaseRealtimeService.getAllParticipants()
        if (mounted) {
          setParticipants(initialParticipants)
          setLastUpdated(new Date().toISOString())
          setIsLoading(false)
        }

        console.log("✅ HOOK: Initialized with", initialParticipants.length, "participants")
      } catch (error) {
        console.error("❌ HOOK: Initialization error:", error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeData()

    // Cleanup function
    return () => {
      mounted = false
      SupabaseRealtimeService.removeParticipantListener(handleParticipantUpdate)
      SupabaseRealtimeService.removeStatusListener(handleStatusUpdate)
      console.log("🧹 HOOK: Cleaned up listeners")
    }
  }, [handleParticipantUpdate, handleStatusUpdate])

  // Refresh data manually
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("🔄 HOOK: Manual refresh requested")

      const refreshedParticipants = await SupabaseRealtimeService.getAllParticipants()
      setParticipants(refreshedParticipants)
      setLastUpdated(new Date().toISOString())

      console.log("✅ HOOK: Refreshed with", refreshedParticipants.length, "participants")
    } catch (error) {
      console.error("❌ HOOK: Refresh error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add participant
  const addParticipant = useCallback(async (participant: Omit<Participant, "id" | "created_at" | "updated_at">) => {
    console.log("➕ HOOK: Adding participant:", participant.certificate_number)
    return await SupabaseRealtimeService.addParticipant(participant)
  }, [])

  // Update participant
  const updateParticipant = useCallback(
    async (id: number, updates: Partial<Omit<Participant, "id" | "created_at" | "updated_at">>) => {
      console.log("✏️ HOOK: Updating participant:", id)
      return await SupabaseRealtimeService.updateParticipant(id, updates)
    },
    [],
  )

  // Delete participant
  const deleteParticipant = useCallback(async (id: number) => {
    console.log("🗑️ HOOK: Deleting participant:", id)
    await SupabaseRealtimeService.deleteParticipant(id)
  }, [])

  return {
    participants,
    isLoading,
    connectionStatus,
    lastUpdated,
    refresh,
    addParticipant,
    updateParticipant,
    deleteParticipant,
  }
}
