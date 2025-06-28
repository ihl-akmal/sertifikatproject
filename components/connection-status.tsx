"use client"

import { Wifi, WifiOff, CheckCircle, Settings } from "lucide-react"

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected" | "error"
  isConfigured: boolean
  participantCount?: number
}

export function ConnectionStatus({ status, isConfigured, participantCount = 0 }: ConnectionStatusProps) {
  // Check environment variables on client side
  const envStatus =
    typeof window !== "undefined"
      ? {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          urlValid:
            process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") &&
            process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(".supabase.co"),
          keyValid: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("eyJ"),
        }
      : { hasUrl: false, hasKey: false, urlValid: false, keyValid: false }

  if (!isConfigured) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">🔵 localStorage Mode</p>
            <p className="text-sm text-blue-700 mt-1">
              Data tersimpan lokal di browser. {participantCount} peserta tersedia.
            </p>

            {/* Environment variables status */}
            <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
              <p className="font-semibold mb-1">Supabase Configuration:</p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={envStatus.hasUrl ? "text-green-600" : "text-red-600"}>
                    {envStatus.hasUrl ? "✅" : "❌"}
                  </span>
                  <span>NEXT_PUBLIC_SUPABASE_URL</span>
                  {envStatus.hasUrl && !envStatus.urlValid && <span className="text-orange-600">(Invalid format)</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={envStatus.hasKey ? "text-green-600" : "text-red-600"}>
                    {envStatus.hasKey ? "✅" : "❌"}
                  </span>
                  <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  {envStatus.hasKey && !envStatus.keyValid && <span className="text-orange-600">(Invalid format)</span>}
                </div>
              </div>
              {!envStatus.hasUrl || !envStatus.hasKey ? (
                <p className="mt-2 text-blue-700">Add environment variables to enable real-time sync</p>
              ) : !envStatus.urlValid || !envStatus.keyValid ? (
                <p className="mt-2 text-orange-700">Check environment variable formats</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />,
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800",
          subTextColor: "text-green-700",
          title: "🟢 Real-Time Connected",
          description: `Sinkronisasi real-time aktif. ${participantCount} peserta tersedia di semua device.`,
        }
      case "connecting":
        return {
          icon: <Wifi className="w-5 h-5 text-yellow-600 mt-0.5 animate-pulse" />,
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-800",
          subTextColor: "text-yellow-700",
          title: "🟡 Connecting...",
          description: "Menghubungkan ke server real-time...",
        }
      case "error":
        return {
          icon: <WifiOff className="w-5 h-5 text-red-600 mt-0.5" />,
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-800",
          subTextColor: "text-red-700",
          title: "🔴 Connection Error",
          description: `Gagal terhubung ke server. Menggunakan data lokal (${participantCount} peserta).`,
        }
      default:
        return {
          icon: <WifiOff className="w-5 h-5 text-gray-600 mt-0.5" />,
          bgColor: "bg-gray-50 border-gray-200",
          textColor: "text-gray-800",
          subTextColor: "text-gray-700",
          title: "⚫ Disconnected",
          description: `Tidak terhubung ke server. Data lokal: ${participantCount} peserta.`,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`p-4 border rounded-lg ${config.bgColor}`}>
      <div className="flex items-start space-x-2">
        {config.icon}
        <div>
          <p className={`text-sm font-semibold ${config.textColor}`}>{config.title}</p>
          <p className={`text-sm mt-1 ${config.subTextColor}`}>{config.description}</p>
        </div>
      </div>
    </div>
  )
}
