import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return empty array - client will handle data
    return NextResponse.json([])
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("📥 API: Received add request:", data.certificate_number)

    // Validate required fields
    if (!data.certificate_number || !data.name || !data.issue_date || !data.class_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Return the data back - client will handle storage
    const newParticipant = {
      certificate_number: data.certificate_number.trim(),
      name: data.name.trim(),
      issue_date: data.issue_date,
      class_name: data.class_name.trim(),
    }

    console.log("✅ API: Validated participant data")
    return NextResponse.json(newParticipant)
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json({ error: "Failed to add participant" }, { status: 500 })
  }
}
