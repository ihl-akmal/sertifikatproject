import { NextResponse } from "next/server"
import { ParticipantService } from "@/lib/supabase"

export async function GET() {
  try {
    const participants = await ParticipantService.getAllParticipants()

    return NextResponse.json({
      total: participants.length,
      participants: participants.map((p) => ({
        id: p.id,
        certificate_number: p.certificate_number,
        name: p.name,
        issue_date: p.issue_date,
        class_name: p.class_name,
      })),
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Failed to fetch debug data" }, { status: 500 })
  }
}
