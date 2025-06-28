import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, use real database
const mockParticipants = [
  {
    id: 1,
    certificate_number: "CERT-2024-001",
    name: "John Doe",
    issue_date: "2024-01-15",
    class_name: "Web Development Fundamentals",
  },
  {
    id: 2,
    certificate_number: "CERT-2024-002",
    name: "Jane Smith",
    issue_date: "2024-01-20",
    class_name: "React Advanced Course",
  },
  {
    id: 3,
    certificate_number: "CERT-2024-003",
    name: "Ahmad Rahman",
    issue_date: "2024-02-01",
    class_name: "Digital Marketing Strategy",
  },
]

let nextId = 4

// Simple Excel-like CSV parser for demo purposes
function parseExcelData(text: string) {
  const lines = text.split("\n").filter((line) => line.trim())
  const participants = []

  // Skip header row if it exists
  const startIndex = lines[0].toLowerCase().includes("nomor") || lines[0].toLowerCase().includes("certificate") ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Split by comma, tab, or semicolon
    const columns = line.split(/[,;\t]/).map((col) => col.trim().replace(/"/g, ""))

    if (columns.length >= 4) {
      const [certificate_number, name, issue_date, class_name] = columns

      if (certificate_number && name && issue_date && class_name) {
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        let formattedDate = issue_date

        // Try to convert different date formats to YYYY-MM-DD
        if (!dateRegex.test(issue_date)) {
          const date = new Date(issue_date)
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split("T")[0]
          } else {
            continue // Skip invalid dates
          }
        }

        participants.push({
          certificate_number: certificate_number.trim(),
          name: name.trim(),
          issue_date: formattedDate,
          class_name: class_name.trim(),
        })
      }
    }
  }

  return participants
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Check file type
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file",
        },
        { status: 400 },
      )
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 5MB",
        },
        { status: 400 },
      )
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const text = new TextDecoder().decode(arrayBuffer)

    // Parse the data
    const parsedParticipants = parseExcelData(text)

    if (parsedParticipants.length === 0) {
      return NextResponse.json(
        {
          error: "No valid data found in file. Please check the format.",
        },
        { status: 400 },
      )
    }

    // Check for duplicate certificate numbers
    const existingNumbers = mockParticipants.map((p) => p.certificate_number.toLowerCase())
    const duplicates = parsedParticipants.filter((p) => existingNumbers.includes(p.certificate_number.toLowerCase()))

    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          error: `Duplicate certificate numbers found: ${duplicates.map((d) => d.certificate_number).join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Add new participants
    const newParticipants = parsedParticipants.map((data) => ({
      id: nextId++,
      ...data,
    }))

    mockParticipants.push(...newParticipants)

    return NextResponse.json({
      success: true,
      message: `${newParticipants.length} participants added successfully`,
      data: newParticipants,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
      },
      { status: 500 },
    )
  }
}
