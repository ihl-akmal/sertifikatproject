import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"

export async function GET() {
  try {
    console.log("🐛 DEBUG API: Getting debug info")

    // Force debug state
    storage.debugState()

    const participants = storage.getAllParticipants()
    const stats = storage.getStats()

    return NextResponse.json({
      status: "success",
      participants: participants.map((p) => ({
        id: p.id,
        certificate_number: p.certificate_number,
        name: p.name,
      })),
      stats,
      debug: {
        total_in_storage: participants.length,
        certificate_numbers: participants.map((p) => p.certificate_number),
      },
    })
  } catch (error) {
    console.error("❌ DEBUG API Error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
