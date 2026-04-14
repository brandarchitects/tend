import { NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 })
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json({ error: "Nur .docx Dateien werden unterstützt" }, { status: 400 })
    }

    // Convert file to buffer and extract text
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.trim()

    if (!text) {
      return NextResponse.json({ error: "Die Datei enthält keinen Text" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      text,
      filename: file.name,
      characters: text.length,
    })
  } catch (error) {
    console.error("Strategy upload error:", error)
    return NextResponse.json({ error: "Fehler beim Verarbeiten der Datei" }, { status: 500 })
  }
}
