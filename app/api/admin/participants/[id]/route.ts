import { type NextRequest, NextResponse } from "next/server"
import { ParticipantService } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const data = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid participant ID" }, { status: 400 })
    }

    const updatedParticipant = await ParticipantService.updateParticipant(id, {
      certificate_number: data.certificate_number?.trim(),
      name: data.name?.trim(),
      issue_date: data.issue_date,
      class_name: data.class_name?.trim(),
    })

    return NextResponse.json(updatedParticipant)
  } catch (error) {
    console.error("Error updating participant:", error)
    return NextResponse.json({ error: "Failed to update participant" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid participant ID" }, { status: 400 })
    }

    await ParticipantService.deleteParticipant(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting participant:", error)
    return NextResponse.json({ error: "Failed to delete participant" }, { status: 500 })
  }
}
