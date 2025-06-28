import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const data = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid participant ID" }, { status: 400 })
    }

    console.log("✏️ API: Received update request for ID:", id)

    // Return the data back - client will handle storage
    const updates = {
      certificate_number: data.certificate_number?.trim(),
      name: data.name?.trim(),
      issue_date: data.issue_date,
      class_name: data.class_name?.trim(),
    }

    console.log("✅ API: Validated update data")
    return NextResponse.json({ id, ...updates })
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json({ error: "Failed to update participant" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid participant ID" }, { status: 400 })
    }

    console.log("🗑️ API: Received delete request for ID:", id)
    console.log("✅ API: Validated delete request")

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json({ error: "Failed to delete participant" }, { status: 500 })
  }
}
