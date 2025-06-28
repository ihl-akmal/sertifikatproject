import { createClient } from "@supabase/supabase-js"

// Simple configuration check without validation during import
const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured = !!(url && key && url.startsWith("https://") && key.startsWith("eyJ"))

  return {
    url,
    key,
    isConfigured,
  }
}

// Get config
const config = getSupabaseConfig()

// Create Supabase client only if configured
export const supabase = config.isConfigured ? createClient(config.url!, config.key!) : null

// Types for our database
export interface Participant {
  id: number
  certificate_number: string
  name: string
  issue_date: string
  class_name: string
  created_at?: string
  updated_at?: string
}

// Global in-memory storage that persists across API calls (fallback only)
class GlobalInMemoryStorage {
  private static instance: GlobalInMemoryStorage
  private participants: Participant[] = [
    {
      id: 1,
      certificate_number: "CERT-2024-001",
      name: "John Doe",
      issue_date: "2024-01-15",
      class_name: "Web Development Fundamentals",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      certificate_number: "CERT-2024-002",
      name: "Jane Smith",
      issue_date: "2024-01-20",
      class_name: "React Advanced Course",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      certificate_number: "CERT-2024-003",
      name: "Ahmad Rahman",
      issue_date: "2024-02-01",
      class_name: "Digital Marketing Strategy",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  private nextId = 4

  public static getInstance(): GlobalInMemoryStorage {
    if (!GlobalInMemoryStorage.instance) {
      GlobalInMemoryStorage.instance = new GlobalInMemoryStorage()
    }
    return GlobalInMemoryStorage.instance
  }

  async getAllParticipants(): Promise<Participant[]> {
    console.log("📋 Getting all participants from in-memory storage:", this.participants.length)
    return [...this.participants]
  }

  async findByCertificateNumber(certificateNumber: string): Promise<Participant | null> {
    console.log("🔍 Searching for certificate:", certificateNumber)
    console.log(
      "📋 Available certificates:",
      this.participants.map((p) => p.certificate_number),
    )

    const participant = this.participants.find(
      (p) => p.certificate_number.toLowerCase().trim() === certificateNumber.toLowerCase().trim(),
    )

    console.log("✅ Found participant:", participant ? participant.name : "Not found")
    return participant || null
  }

  async addParticipant(participant: Omit<Participant, "id" | "created_at" | "updated_at">): Promise<Participant> {
    // Check for duplicate
    const existing = await this.findByCertificateNumber(participant.certificate_number)
    if (existing) {
      throw new Error(`Certificate number ${participant.certificate_number} already exists`)
    }

    const newParticipant: Participant = {
      id: this.nextId++,
      ...participant,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.participants.push(newParticipant)
    console.log("➕ Added new participant:", newParticipant.certificate_number)
    console.log("📊 Total participants now:", this.participants.length)
    return newParticipant
  }

  async updateParticipant(
    id: number,
    updates: Partial<Omit<Participant, "id" | "created_at" | "updated_at">>,
  ): Promise<Participant> {
    const index = this.participants.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error("Participant not found")
    }

    this.participants[index] = {
      ...this.participants[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    console.log("✏️ Updated participant:", this.participants[index].certificate_number)
    return this.participants[index]
  }

  async deleteParticipant(id: number): Promise<void> {
    const index = this.participants.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error("Participant not found")
    }

    const deleted = this.participants[index]
    this.participants.splice(index, 1)
    console.log("🗑️ Deleted participant:", deleted.certificate_number)
    console.log("📊 Total participants now:", this.participants.length)
  }

  async findById(id: number): Promise<Participant | null> {
    return this.participants.find((p) => p.id === id) || null
  }

  // Debug method to see current state
  debugState(): void {
    console.log("🐛 DEBUG - Current participants in storage:")
    this.participants.forEach((p, index) => {
      console.log(`${index + 1}. ${p.certificate_number} - ${p.name}`)
    })
  }
}

// Create singleton instance
const globalStorage = GlobalInMemoryStorage.getInstance()

// Database operations with improved Supabase integration
export class ParticipantService {
  static async getAllParticipants(): Promise<Participant[]> {
    const currentConfig = getSupabaseConfig()

    if (!currentConfig.isConfigured || !supabase) {
      console.warn("⚠️ Supabase not configured, using in-memory storage")
      console.warn("Missing:", {
        url: !!currentConfig.url,
        key: !!currentConfig.key,
        urlFormat: currentConfig.url?.startsWith("https://"),
        keyFormat: currentConfig.key?.startsWith("eyJ"),
      })
      return globalStorage.getAllParticipants()
    }

    try {
      console.log("🔗 Fetching participants from Supabase...")
      const { data, error } = await supabase.from("participants").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Supabase error:", error)
        console.warn("🔄 Falling back to in-memory storage")
        return globalStorage.getAllParticipants()
      }

      console.log("✅ Fetched from Supabase:", data?.length || 0, "participants")
      return data || []
    } catch (error) {
      console.error("❌ Supabase connection failed, falling back to in-memory storage:", error)
      return globalStorage.getAllParticipants()
    }
  }

  static async findByCertificateNumber(certificateNumber: string): Promise<Participant | null> {
    const currentConfig = getSupabaseConfig()

    if (!currentConfig.isConfigured || !supabase) {
      console.warn("⚠️ Supabase not configured, using in-memory storage")
      return globalStorage.findByCertificateNumber(certificateNumber)
    }

    try {
      console.log("🔍 Searching Supabase for certificate:", certificateNumber)
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .ilike("certificate_number", certificateNumber.trim())
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("❌ Certificate not found in Supabase")
          return null
        }
        console.error("❌ Supabase error:", error)
        console.warn("🔄 Falling back to in-memory storage")
        return globalStorage.findByCertificateNumber(certificateNumber)
      }

      console.log("✅ Found in Supabase:", data.name)
      return data
    } catch (error) {
      console.error("❌ Supabase connection failed, falling back to in-memory storage:", error)
      return globalStorage.findByCertificateNumber(certificateNumber)
    }
  }

  static async addParticipant(
    participant: Omit<Participant, "id" | "created_at" | "updated_at">,
  ): Promise<Participant> {
    const currentConfig = getSupabaseConfig()

    if (!currentConfig.isConfigured || !supabase) {
      console.warn("⚠️ Supabase not configured, using in-memory storage")
      return globalStorage.addParticipant(participant)
    }

    try {
      console.log("➕ Adding participant to Supabase:", participant.certificate_number)
      const { data, error } = await supabase.from("participants").insert([participant]).select().single()

      if (error) {
        console.error("❌ Supabase error:", error)
        if (error.code === "23505") {
          throw new Error(`Certificate number ${participant.certificate_number} already exists`)
        }
        console.warn("🔄 Falling back to in-memory storage")
        return globalStorage.addParticipant(participant)
      }

      console.log("✅ Added to Supabase:", data.name)
      return data
    } catch (error) {
      console.error("❌ Supabase connection failed, falling back to in-memory storage:", error)
      return globalStorage.addParticipant(participant)
    }
  }

  static async updateParticipant(
    id: number,
    updates: Partial<Omit<Participant, "id" | "created_at" | "updated_at">>,
  ): Promise<Participant> {
    const currentConfig = getSupabaseConfig()

    if (!currentConfig.isConfigured || !supabase) {
      console.warn("⚠️ Supabase not configured, using in-memory storage")
      return globalStorage.updateParticipant(id, updates)
    }

    try {
      console.log("✏️ Updating participant in Supabase:", id)
      const { data, error } = await supabase.from("participants").update(updates).eq("id", id).select().single()

      if (error) {
        console.error("❌ Supabase error:", error)
        console.warn("🔄 Falling back to in-memory storage")
        return globalStorage.updateParticipant(id, updates)
      }

      console.log("✅ Updated in Supabase:", data.name)
      return data
    } catch (error) {
      console.error("❌ Supabase connection failed, falling back to in-memory storage:", error)
      return globalStorage.updateParticipant(id, updates)
    }
  }

  static async deleteParticipant(id: number): Promise<void> {
    const currentConfig = getSupabaseConfig()

    if (!currentConfig.isConfigured || !supabase) {
      console.warn("⚠️ Supabase not configured, using in-memory storage")
      return globalStorage.deleteParticipant(id)
    }

    try {
      console.log("🗑️ Deleting participant from Supabase:", id)
      const { error } = await supabase.from("participants").delete().eq("id", id)

      if (error) {
        console.error("❌ Supabase error:", error)
        console.warn("🔄 Falling back to in-memory storage")
        return globalStorage.deleteParticipant(id)
      }

      console.log("✅ Deleted from Supabase")
    } catch (error) {
      console.error("❌ Supabase connection failed, falling back to in-memory storage:", error)
      return globalStorage.deleteParticipant(id)
    }
  }

  static async findById(id: number): Promise<Participant | null> {
    const currentConfig = getSupabaseConfig()

    if (!currentConfig.isConfigured || !supabase) {
      console.warn("⚠️ Supabase not configured, using in-memory storage")
      return globalStorage.findById(id)
    }

    try {
      const { data, error } = await supabase.from("participants").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        console.error("❌ Supabase error:", error)
        console.warn("🔄 Falling back to in-memory storage")
        return globalStorage.findById(id)
      }

      return data
    } catch (error) {
      console.error("❌ Supabase connection failed, falling back to in-memory storage:", error)
      return globalStorage.findById(id)
    }
  }
}

// Export configuration status with safe checking
export const isSupabaseReady = config.isConfigured
