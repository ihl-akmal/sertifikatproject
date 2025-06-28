// Simple in-memory storage with better persistence simulation
class PersistentStorage {
  private static instance: PersistentStorage
  private participants: Map<string, any> = new Map()
  private nextId = 4

  private constructor() {
    // Initialize with sample data
    this.participants.set("1", {
      id: 1,
      certificate_number: "CERT-2024-001",
      name: "John Doe",
      issue_date: "2024-01-15",
      class_name: "Web Development Fundamentals",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    this.participants.set("2", {
      id: 2,
      certificate_number: "CERT-2024-002",
      name: "Jane Smith",
      issue_date: "2024-01-20",
      class_name: "React Advanced Course",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    this.participants.set("3", {
      id: 3,
      certificate_number: "CERT-2024-003",
      name: "Ahmad Rahman",
      issue_date: "2024-02-01",
      class_name: "Digital Marketing Strategy",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    console.log("🚀 Storage initialized with", this.participants.size, "participants")
  }

  public static getInstance(): PersistentStorage {
    if (!PersistentStorage.instance) {
      PersistentStorage.instance = new PersistentStorage()
    }
    return PersistentStorage.instance
  }

  getAllParticipants() {
    const participants = Array.from(this.participants.values())
    console.log("📋 Retrieved", participants.length, "participants")
    return participants
  }

  findByCertificateNumber(certificateNumber: string) {
    const cleanCert = certificateNumber.toLowerCase().trim()
    console.log("🔍 Searching for certificate:", cleanCert)

    const participants = Array.from(this.participants.values())
    console.log(
      "📋 Available certificates:",
      participants.map((p) => p.certificate_number),
    )

    const participant = participants.find((p) => p.certificate_number.toLowerCase().trim() === cleanCert)

    console.log("✅ Search result:", participant ? participant.name : "Not found")
    return participant || null
  }

  addParticipant(data: any) {
    // Check for duplicate
    const existing = this.findByCertificateNumber(data.certificate_number)
    if (existing) {
      throw new Error(`Certificate number ${data.certificate_number} already exists`)
    }

    const newParticipant = {
      id: this.nextId++,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.participants.set(newParticipant.id.toString(), newParticipant)
    console.log("➕ Added participant:", newParticipant.certificate_number, "Total:", this.participants.size)

    return newParticipant
  }

  updateParticipant(id: number, updates: any) {
    const participant = this.participants.get(id.toString())
    if (!participant) {
      throw new Error("Participant not found")
    }

    const updated = {
      ...participant,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.participants.set(id.toString(), updated)
    console.log("✏️ Updated participant:", updated.certificate_number)

    return updated
  }

  deleteParticipant(id: number) {
    const participant = this.participants.get(id.toString())
    if (!participant) {
      throw new Error("Participant not found")
    }

    this.participants.delete(id.toString())
    console.log("🗑️ Deleted participant:", participant.certificate_number, "Total:", this.participants.size)
  }

  findById(id: number) {
    return this.participants.get(id.toString()) || null
  }

  getStats() {
    return {
      total: this.participants.size,
      lastUpdated: new Date().toISOString(),
    }
  }

  // Debug method
  debugState() {
    console.log("🐛 DEBUG - Current storage state:")
    console.log("Total participants:", this.participants.size)
    Array.from(this.participants.values()).forEach((p, index) => {
      console.log(`${index + 1}. ${p.certificate_number} - ${p.name}`)
    })
  }
}

// Export singleton instance
export const storage = PersistentStorage.getInstance()

// Types
export interface Participant {
  id: number
  certificate_number: string
  name: string
  issue_date: string
  class_name: string
  created_at: string
  updated_at: string
}
