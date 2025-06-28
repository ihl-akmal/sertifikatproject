"use client"

export interface Participant {
  id: number
  certificate_number: string
  name: string
  issue_date: string
  class_name: string
  created_at: string
  updated_at: string
}

const STORAGE_KEY = "grazedu_participants"

// Client-side storage management
export class ClientStorage {
  static getParticipants(): Participant[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        console.log("📋 CLIENT: Retrieved", data.participants.length, "participants from localStorage")
        return data.participants
      }
    } catch (error) {
      console.error("❌ CLIENT: Error reading localStorage:", error)
    }

    // Return default data if nothing stored
    const defaultData = [
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

    this.saveParticipants(defaultData, 4)
    return defaultData
  }

  static saveParticipants(participants: Participant[], nextId = 4) {
    if (typeof window === "undefined") return

    try {
      const data = {
        participants,
        nextId,
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log("💾 CLIENT: Saved", participants.length, "participants to localStorage")
    } catch (error) {
      console.error("❌ CLIENT: Error saving to localStorage:", error)
    }
  }

  static getNextId(): number {
    if (typeof window === "undefined") return 4

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        return data.nextId || 4
      }
    } catch (error) {
      console.error("❌ CLIENT: Error reading nextId:", error)
    }
    return 4
  }

  static addParticipant(participant: Omit<Participant, "id" | "created_at" | "updated_at">): Participant {
    const participants = this.getParticipants()
    const nextId = this.getNextId()

    // Check for duplicate
    const existing = participants.find(
      (p) => p.certificate_number.toLowerCase().trim() === participant.certificate_number.toLowerCase().trim(),
    )
    if (existing) {
      throw new Error(`Certificate number ${participant.certificate_number} already exists`)
    }

    const newParticipant: Participant = {
      id: nextId,
      ...participant,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    participants.push(newParticipant)
    this.saveParticipants(participants, nextId + 1)

    console.log("➕ CLIENT: Added participant:", newParticipant.certificate_number)
    return newParticipant
  }

  static updateParticipant(
    id: number,
    updates: Partial<Omit<Participant, "id" | "created_at" | "updated_at">>,
  ): Participant {
    const participants = this.getParticipants()
    const nextId = this.getNextId()

    const index = participants.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error("Participant not found")
    }

    participants[index] = {
      ...participants[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.saveParticipants(participants, nextId)
    console.log("✏️ CLIENT: Updated participant:", participants[index].certificate_number)
    return participants[index]
  }

  static deleteParticipant(id: number) {
    const participants = this.getParticipants()
    const nextId = this.getNextId()

    const index = participants.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error("Participant not found")
    }

    const deleted = participants[index]
    participants.splice(index, 1)
    this.saveParticipants(participants, nextId)

    console.log("🗑️ CLIENT: Deleted participant:", deleted.certificate_number)
  }

  static findByCertificateNumber(certificateNumber: string): Participant | null {
    const participants = this.getParticipants()
    const cleanCert = certificateNumber.toLowerCase().trim()

    console.log("🔍 CLIENT: Searching for certificate:", cleanCert)
    console.log(
      "📋 CLIENT: Available certificates:",
      participants.map((p) => p.certificate_number),
    )

    const participant = participants.find((p) => p.certificate_number.toLowerCase().trim() === cleanCert)

    console.log("✅ CLIENT: Search result:", participant ? participant.name : "Not found")
    return participant || null
  }

  static findById(id: number): Participant | null {
    const participants = this.getParticipants()
    return participants.find((p) => p.id === id) || null
  }

  static getStats() {
    const participants = this.getParticipants()
    return {
      total: participants.length,
      lastUpdated: new Date().toISOString(),
    }
  }

  static clear() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
      console.log("🗑️ CLIENT: Cleared all data")
    }
  }
}
