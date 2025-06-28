import { type NextRequest, NextResponse } from "next/server"
import { ParticipantService } from "@/lib/supabase"

export async function GET() {
  try {
    const participants = await ParticipantService.getAllParticipants()
    return NextResponse.json(participants)
  } catch (error) {
    console.error("Error fetching participants:", error)
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.certificate_number || !data.name || !data.issue_date || !data.class_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const newParticipant = await ParticipantService.addParticipant({
      certificate_number: data.certificate_number.trim(),
      name: data.name.trim(),
      issue_date: data.issue_date,
      class_name: data.class_name.trim(),
    })

    console.log("Added new participant:", newParticipant)

    return NextResponse.json(newParticipant)
  } catch (error) {
    console.error("Error adding participant:", error)

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to add participant" }, { status: 500 })
  }
}
