import { createClient } from "@supabase/supabase-js"
import { ClientStorage } from "./client-storage"

// Safe environment variable access
const getSupabaseConfig = () => {
  if (typeof window === "undefined") {
    // Server-side: return empty config
    return { url: null, key: null, isConfigured: false }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured = !!(
    url &&
    key &&
    url.startsWith("https://") &&
    url.includes(".supabase.co") &&
    key.startsWith("eyJ")
  )

  return { url, key, isConfigured }
}

// Get config safely
const config = getSupabaseConfig()

// Create Supabase client only if properly configured and on client-side
export const supabase =
  config.isConfigured && typeof window !== "undefined" ? createClient(config.url!, config.key!) : null

// Check if Supabase is configured
export const isSupabaseConfigured = config.isConfigured

export interface Participant {
  id: number
  certificate_number: string
  name: string
  issue_date: string
  class_name: string
  created_at?: string
  updated_at?: string
}

// Connection status
let connectionStatus: "connected" | "connecting" | "disconnected" | "error" = "disconnected"

// Event listeners for real-time updates
const listeners: Array<(participants: Participant[]) => void> = []
const statusListeners: Array<(status: typeof connectionStatus) => void> = []

// Real-time subscription
let realtimeSubscription: any = null

export class SupabaseRealtimeService {
  // Add listener for participant updates
  static addParticipantListener(callback: (participants: Participant[]) => void) {
    listeners.push(callback)
    console.log("📡 REALTIME: Added participant listener, total:", listeners.length)
  }

  // Remove listener
  static removeParticipantListener(callback: (participants: Participant[]) => void) {
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
      console.log("📡 REALTIME: Removed participant listener, total:", listeners.length)
    }
  }

  // Add status listener
  static addStatusListener(callback: (status: typeof connectionStatus) => void) {
    statusListeners.push(callback)
    callback(connectionStatus) // Send current status immediately
  }

  // Remove status listener
  static removeStatusListener(callback: (status: typeof connectionStatus) => void) {
    const index = statusListeners.indexOf(callback)
    if (index > -1) {
      statusListeners.splice(index, 1)
    }
  }

  // Notify all listeners
  static notifyListeners(participants: Participant[]) {
    listeners.forEach((callback) => {
      try {
        callback(participants)
      } catch (error) {
        console.error("❌ REALTIME: Error in listener callback:", error)
      }
    })
  }

  // Notify status listeners
  static notifyStatusListeners(status: typeof connectionStatus) {
    connectionStatus = status
    statusListeners.forEach((callback) => {
      try {
        callback(status)
      } catch (error) {
        console.error("❌ REALTIME: Error in status callback:", error)
      }
    })
  }

  // Initialize real-time connection
  static async initialize() {
    if (typeof window === "undefined") {
      console.log("🔄 REALTIME: Server-side, skipping initialization")
      return false
    }

    if (!isSupabaseConfigured || !supabase) {
      console.warn("⚠️ REALTIME: Supabase not configured, using localStorage only")
      this.notifyStatusListeners("disconnected")
      return false
    }

    try {
      console.log("🔗 REALTIME: Initializing Supabase connection...")
      this.notifyStatusListeners("connecting")

      // Test connection
      const { data, error } = await supabase.from("participants").select("count", { count: "exact", head: true })

      if (error) {
        console.error("❌ REALTIME: Connection test failed:", error)
        this.notifyStatusListeners("error")
        return false
      }

      console.log("✅ REALTIME: Connection successful")
      this.notifyStatusListeners("connected")

      // Setup real-time subscription
      this.setupRealtimeSubscription()

      // Initial data sync
      await this.syncFromSupabase()

      return true
    } catch (error) {
      console.error("❌ REALTIME: Initialization failed:", error)
      this.notifyStatusListeners("error")
      return false
    }
  }

  // Setup real-time subscription
  static setupRealtimeSubscription() {
    if (!supabase) return

    // Remove existing subscription
    if (realtimeSubscription) {
      supabase.removeChannel(realtimeSubscription)
    }

    console.log("📡 REALTIME: Setting up real-time subscription...")

    realtimeSubscription = supabase
      .channel("participants_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "participants",
        },
        (payload) => {
          console.log("📡 REALTIME: Received change:", payload.eventType, payload.new || payload.old)

          // Sync data after any change
          this.syncFromSupabase()
        },
      )
      .subscribe((status) => {
        console.log("📡 REALTIME: Subscription status:", status)

        if (status === "SUBSCRIBED") {
          console.log("✅ REALTIME: Successfully subscribed to changes")
          this.notifyStatusListeners("connected")
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ REALTIME: Subscription error")
          this.notifyStatusListeners("error")
        }
      })
  }

  // Sync data from Supabase to localStorage and notify listeners
  static async syncFromSupabase() {
    if (!supabase) return

    try {
      console.log("🔄 REALTIME: Syncing from Supabase...")

      const { data, error } = await supabase.from("participants").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("❌ REALTIME: Sync error:", error)
        return
      }

      console.log("✅ REALTIME: Synced", data?.length || 0, "participants from Supabase")

      // Update localStorage
      if (data) {
        const nextId = Math.max(...data.map((p) => p.id), 0) + 1
        ClientStorage.saveParticipants(data, nextId)

        // Notify all listeners
        this.notifyListeners(data)
      }
    } catch (error) {
      console.error("❌ REALTIME: Sync failed:", error)
    }
  }

  // Get all participants (with real-time sync)
  static async getAllParticipants(): Promise<Participant[]> {
    if (typeof window === "undefined") {
      console.log("🔄 REALTIME: Server-side, returning empty array")
      return []
    }

    if (!isSupabaseConfigured || !supabase) {
      console.warn("⚠️ REALTIME: Using localStorage only")
      return ClientStorage.getParticipants()
    }

    try {
      // Try to get from Supabase first
      const { data, error } = await supabase.from("participants").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("❌ REALTIME: Error fetching from Supabase, using localStorage:", error)
        return ClientStorage.getParticipants()
      }

      console.log("✅ REALTIME: Fetched", data?.length || 0, "participants from Supabase")

      // Update localStorage cache
      if (data) {
        const nextId = Math.max(...data.map((p) => p.id), 0) + 1
        ClientStorage.saveParticipants(data, nextId)
      }

      return data || []
    } catch (error) {
      console.error("❌ REALTIME: Network error, using localStorage:", error)
      return ClientStorage.getParticipants()
    }
  }

  // Add participant (with real-time sync)
  static async addParticipant(
    participant: Omit<Participant, "id" | "created_at" | "updated_at">,
  ): Promise<Participant> {
    if (typeof window === "undefined") {
      throw new Error("Cannot add participant on server-side")
    }

    // Always add to localStorage first for immediate feedback
    const localParticipant = ClientStorage.addParticipant(participant)

    if (!isSupabaseConfigured || !supabase) {
      console.warn("⚠️ REALTIME: Added to localStorage only")
      this.notifyListeners(ClientStorage.getParticipants())
      return localParticipant
    }

    try {
      console.log("➕ REALTIME: Adding to Supabase:", participant.certificate_number)

      const { data, error } = await supabase.from("participants").insert([participant]).select().single()

      if (error) {
        console.error("❌ REALTIME: Error adding to Supabase:", error)

        if (error.code === "23505") {
          // Duplicate key
          // Remove from localStorage if duplicate in Supabase
          ClientStorage.deleteParticipant(localParticipant.id)
          throw new Error(`Certificate number ${participant.certificate_number} already exists`)
        }

        // Keep in localStorage even if Supabase fails
        console.warn("⚠️ REALTIME: Kept in localStorage despite Supabase error")
        return localParticipant
      }

      console.log("✅ REALTIME: Successfully added to Supabase:", data.certificate_number)

      // Update localStorage with Supabase data (has proper ID and timestamps)
      ClientStorage.deleteParticipant(localParticipant.id) // Remove temp local entry
      const participants = ClientStorage.getParticipants()
      participants.push(data)
      const nextId = Math.max(...participants.map((p) => p.id), 0) + 1
      ClientStorage.saveParticipants(participants, nextId)

      // Real-time subscription will handle notifying other clients
      return data
    } catch (error) {
      console.error("❌ REALTIME: Add failed:", error)
      throw error
    }
  }

  // Update participant (with real-time sync)
  static async updateParticipant(
    id: number,
    updates: Partial<Omit<Participant, "id" | "created_at" | "updated_at">>,
  ): Promise<Participant> {
    if (typeof window === "undefined") {
      throw new Error("Cannot update participant on server-side")
    }

    // Update localStorage first
    const localParticipant = ClientStorage.updateParticipant(id, updates)

    if (!isSupabaseConfigured || !supabase) {
      console.warn("⚠️ REALTIME: Updated localStorage only")
      this.notifyListeners(ClientStorage.getParticipants())
      return localParticipant
    }

    try {
      console.log("✏️ REALTIME: Updating in Supabase:", id)

      const { data, error } = await supabase.from("participants").update(updates).eq("id", id).select().single()

      if (error) {
        console.error("❌ REALTIME: Error updating in Supabase:", error)
        return localParticipant
      }

      console.log("✅ REALTIME: Successfully updated in Supabase")

      // Update localStorage with Supabase data
      const participants = ClientStorage.getParticipants()
      const index = participants.findIndex((p) => p.id === id)
      if (index > -1) {
        participants[index] = data
        ClientStorage.saveParticipants(participants, ClientStorage.getNextId())
      }

      return data
    } catch (error) {
      console.error("❌ REALTIME: Update failed:", error)
      return localParticipant
    }
  }

  // Delete participant (with real-time sync)
  static async deleteParticipant(id: number): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("Cannot delete participant on server-side")
    }

    // Delete from localStorage first
    ClientStorage.deleteParticipant(id)

    if (!isSupabaseConfigured || !supabase) {
      console.warn("⚠️ REALTIME: Deleted from localStorage only")
      this.notifyListeners(ClientStorage.getParticipants())
      return
    }

    try {
      console.log("🗑️ REALTIME: Deleting from Supabase:", id)

      const { error } = await supabase.from("participants").delete().eq("id", id)

      if (error) {
        console.error("❌ REALTIME: Error deleting from Supabase:", error)
        return
      }

      console.log("✅ REALTIME: Successfully deleted from Supabase")
    } catch (error) {
      console.error("❌ REALTIME: Delete failed:", error)
    }
  }

  // Find by certificate number (with real-time sync)
  static async findByCertificateNumber(certificateNumber: string): Promise<Participant | null> {
    if (typeof window === "undefined") {
      console.log("🔄 REALTIME: Server-side, returning null")
      return null
    }

    if (!isSupabaseConfigured || !supabase) {
      console.warn("⚠️ REALTIME: Searching localStorage only")
      return ClientStorage.findByCertificateNumber(certificateNumber)
    }

    try {
      console.log("🔍 REALTIME: Searching Supabase for:", certificateNumber)

      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .ilike("certificate_number", certificateNumber.trim())
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("❌ REALTIME: Certificate not found in Supabase")
          return null
        }
        console.error("❌ REALTIME: Search error, trying localStorage:", error)
        return ClientStorage.findByCertificateNumber(certificateNumber)
      }

      console.log("✅ REALTIME: Found in Supabase:", data.name)
      return data
    } catch (error) {
      console.error("❌ REALTIME: Search failed, trying localStorage:", error)
      return ClientStorage.findByCertificateNumber(certificateNumber)
    }
  }

  // Get connection status
  static getConnectionStatus() {
    return {
      isConfigured: isSupabaseConfigured,
      status: connectionStatus,
      isOnline: typeof window !== "undefined" && navigator.onLine,
    }
  }

  // Cleanup
  static cleanup() {
    if (realtimeSubscription && supabase) {
      supabase.removeChannel(realtimeSubscription)
      realtimeSubscription = null
    }
    listeners.length = 0
    statusListeners.length = 0
  }
}

// Auto-initialize when module loads (client-side only)
if (typeof window !== "undefined") {
  // Delay initialization to ensure environment variables are loaded
  setTimeout(() => {
    SupabaseRealtimeService.initialize().catch(console.error)
  }, 100)
}
