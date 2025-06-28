// Configuration validator - now lazy loaded
export function validateSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("⚠️ Supabase configuration missing!")
    console.warn("Required environment variables:")
    console.warn("- NEXT_PUBLIC_SUPABASE_URL")
    console.warn("- NEXT_PUBLIC_SUPABASE_ANON_KEY")
    return false
  }

  if (!url.startsWith("https://")) {
    console.warn("⚠️ Invalid Supabase URL format:", url)
    console.warn("Expected format: https://your-project.supabase.co")
    return false
  }

  if (!key.startsWith("eyJ")) {
    console.warn("⚠️ Invalid Supabase anon key format")
    console.warn("Expected format: eyJ...")
    return false
  }

  console.log("✅ Supabase configuration valid")
  return true
}

// Lazy configuration object - only validates when accessed
export const supabaseConfig = {
  get url() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
  },
  get anonKey() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  get isConfigured() {
    return validateSupabaseConfig()
  },
}
