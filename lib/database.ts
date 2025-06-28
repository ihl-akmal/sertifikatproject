import { promises as fs } from "fs"
import path from "path"

// Types for our database
export interface Participant {
  id: number
  certificate_number: string
  name: string
  issue_date: string
  class_name: string
  created_at: string
  updated_at: string
}

// Database file path
const DB_FILE = path.join(process.cwd(), "data", "participants.json")

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DB_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Initialize database with sample data if it doesn't exist
async function initializeDatabase() {
  try {
    await fs.access(DB_FILE)
  } catch {
    // File doesn't exist, create it with sample data
    const initialData = {
      participants: [
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
      ],
      nextId: 4,
      lastUpdated: new Date().toISOString(),
    }

    await ensureDataDir()
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2))
    console.log("✅ Database initialized with sample data")
  }
}

// Read database
async function readDatabase() {
  await initializeDatabase()
  try {
    const data = await fs.readFile(DB_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("❌ Error reading database:", error)
    throw new Error("Failed to read database")
  }
}

// Write database
async function writeDatabase(data: any) {
  try {
    data.lastUpdated = new Date().toISOString()
    await ensureDataDir()
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2))
    console.log("✅ Database updated")
  } catch (error) {
    console.error("❌ Error writing database:", error)
    throw new Error("Failed to write database")
  }
}

// Database operations
export class DatabaseService {
  static async getAllParticipants(): Promise<Participant[]> {
    const db = await readDatabase()
    console.log("📋 Retrieved", db.participants.length, "participants from database")
    return db.participants
  }

  static async findByCertificateNumber(certificateNumber: string): Promise<Participant | null> {
    const db = await readDatabase()
    const participant = db.participants.find(
      (p: Participant) => p.certificate_number.toLowerCase().trim() === certificateNumber.toLowerCase().trim(),
    )

    console.log("🔍 Searching for:", certificateNumber)
    console.log(
      "📋 Available certificates:",
      db.participants.map((p: Participant) => p.certificate_number),
    )
    console.log("✅ Found:", participant ? participant.name : "Not found")

    return participant || null
  }

  static async addParticipant(
    participant: Omit<Participant, "id" | "created_at" | "updated_at">,
  ): Promise<Participant> {
    const db = await readDatabase()

    // Check for duplicate
    const existing = db.participants.find(
      (p: Participant) =>
        p.certificate_number.toLowerCase().trim() === participant.certificate_number.toLowerCase().trim(),
    )

    if (existing) {
      throw new Error(`Certificate number ${participant.certificate_number} already exists`)
    }

    const newParticipant: Participant = {
      id: db.nextId,
      ...participant,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    db.participants.push(newParticipant)
    db.nextId += 1

    await writeDatabase(db)
    console.log("➕ Added participant:", newParticipant.certificate_number)

    return newParticipant
  }

  static async updateParticipant(
    id: number,
    updates: Partial<Omit<Participant, "id" | "created_at" | "updated_at">>,
  ): Promise<Participant> {
    const db = await readDatabase()
    const index = db.participants.findIndex((p: Participant) => p.id === id)

    if (index === -1) {
      throw new Error("Participant not found")
    }

    db.participants[index] = {
      ...db.participants[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    await writeDatabase(db)
    console.log("✏️ Updated participant:", db.participants[index].certificate_number)

    return db.participants[index]
  }

  static async deleteParticipant(id: number): Promise<void> {
    const db = await readDatabase()
    const index = db.participants.findIndex((p: Participant) => p.id === id)

    if (index === -1) {
      throw new Error("Participant not found")
    }

    const deleted = db.participants[index]
    db.participants.splice(index, 1)

    await writeDatabase(db)
    console.log("🗑️ Deleted participant:", deleted.certificate_number)
  }

  static async findById(id: number): Promise<Participant | null> {
    const db = await readDatabase()
    return db.participants.find((p: Participant) => p.id === id) || null
  }

  static async getLastUpdated(): Promise<string> {
    const db = await readDatabase()
    return db.lastUpdated
  }

  static async getStats(): Promise<{ total: number; lastUpdated: string }> {
    const db = await readDatabase()
    return {
      total: db.participants.length,
      lastUpdated: db.lastUpdated,
    }
  }
}
