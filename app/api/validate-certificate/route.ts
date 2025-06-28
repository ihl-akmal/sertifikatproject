import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { certificateNumber } = await request.json()

    if (!certificateNumber || !certificateNumber.trim()) {
      return NextResponse.json({ error: "Certificate number is required" }, { status: 400 })
    }

    console.log("🔍 VALIDATION API: Received request for:", certificateNumber.trim())

    // Return the certificate number back - client will handle validation
    return NextResponse.json({
      certificateNumber: certificateNumber.trim(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ VALIDATION API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
