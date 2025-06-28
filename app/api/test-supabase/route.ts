import { NextResponse } from "next/server"
import { supabase, isSupabaseReady } from "@/lib/supabase"

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Detailed configuration check
    const configStatus = {
      url_exists: !!url,
      key_exists: !!key,
      url_format: url ? url.startsWith("https://") : false,
      key_format: key ? key.startsWith("eyJ") : false,
      url_value: url ? `${url.substring(0, 20)}...` : "not set",
      key_value: key ? `${key.substring(0, 20)}...` : "not set",
    }

    if (!isSupabaseReady || !supabase) {
      return NextResponse.json({
        status: "not_configured",
        message: "Supabase environment variables not properly configured",
        configured: false,
        config_details: configStatus,
      })
    }

    // Test connection by fetching participants count
    const { data, error, count } = await supabase.from("participants").select("*", { count: "exact", head: true })

    if (error) {
      return NextResponse.json({
        status: "error",
        message: error.message,
        configured: true,
        connected: false,
        config_details: configStatus,
      })
    }

    return NextResponse.json({
      status: "success",
      message: "Supabase connection successful",
      configured: true,
      connected: true,
      participantCount: count || 0,
      config_details: configStatus,
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      configured: false,
      connected: false,
    })
  }
}
