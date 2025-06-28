"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Bug } from "lucide-react"
import { SupabaseRealtimeService, type Participant } from "@/lib/supabase-realtime"
import { ConnectionStatus } from "@/components/connection-status"
import { ClientStorage } from "@/lib/client-storage"
import { SetupGuide } from "@/components/setup-guide"

export default function CertificateValidation() {
  const [certificateNumber, setCertificateNumber] = useState("")
  const [result, setResult] = useState<Participant | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">(
    "disconnected",
  )

  // Update participant count and connection status
  useEffect(() => {
    const updateData = async () => {
      try {
        const participants = await SupabaseRealtimeService.getAllParticipants()
        setTotalParticipants(participants.length)
      } catch (error) {
        console.error("Error updating participant count:", error)
        // Fallback to localStorage if Supabase fails
        if (typeof window !== "undefined") {
          const localParticipants = ClientStorage.getParticipants()
          setTotalParticipants(localParticipants.length)
        }
      }
    }

    const handleStatusUpdate = (status: typeof connectionStatus) => {
      setConnectionStatus(status)
    }

    // Initial update with error handling
    updateData().catch(console.error)

    // Setup real-time listeners with error handling
    try {
      SupabaseRealtimeService.addStatusListener(handleStatusUpdate)
      SupabaseRealtimeService.addParticipantListener((participants) => {
        setTotalParticipants(participants.length)
      })
    } catch (error) {
      console.error("Error setting up listeners:", error)
    }

    // Update every 5 seconds as fallback
    const interval = setInterval(() => {
      updateData().catch(console.error)
    }, 5000)

    return () => {
      clearInterval(interval)
      try {
        SupabaseRealtimeService.removeStatusListener(handleStatusUpdate)
      } catch (error) {
        console.error("Error removing listeners:", error)
      }
    }
  }, [])

  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certificateNumber.trim()) return

    setIsLoading(true)
    setResult(null)
    setNotFound(false)

    try {
      console.log("🔍 VALIDATION: Searching for certificate:", certificateNumber.trim())

      const participant = await SupabaseRealtimeService.findByCertificateNumber(certificateNumber.trim())

      if (participant) {
        console.log("✅ VALIDATION: Certificate found:", participant.name)
        setResult(participant)
      } else {
        console.log("❌ VALIDATION: Certificate not found")
        setNotFound(true)
      }
    } catch (error) {
      console.error("❌ VALIDATION: Error:", error)
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDebug = async () => {
    try {
      const participants = await SupabaseRealtimeService.getAllParticipants()
      const status = SupabaseRealtimeService.getConnectionStatus()

      const debugData = {
        status,
        participants: participants.map((p) => ({
          id: p.id,
          certificate_number: p.certificate_number,
          name: p.name,
        })),
        debug: {
          total_in_storage: participants.length,
          certificate_numbers: participants.map((p) => p.certificate_number),
        },
      }

      setDebugInfo(debugData)
      console.log("🐛 DEBUG INFO:", debugData)

      alert(
        `Debug Info:\nTotal: ${participants.length} participants\nStatus: ${connectionStatus}\nConfigured: ${status.isConfigured}\nCertificates: ${debugData.debug.certificate_numbers.join(", ")}\n\nCheck console for details`,
      )
    } catch (error) {
      console.error("Debug error:", error)
      alert("Error fetching debug data")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center">
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-6 py-3 rounded-lg">
                <h1 className="text-2xl font-bold">GRAZEDU</h1>
                <p className="text-sm text-pink-100">Great Zilenial Education</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          {/* Connection Status */}
          <div className="mb-6">
            <ConnectionStatus
              status={connectionStatus}
              isConfigured={SupabaseRealtimeService.getConnectionStatus().isConfigured}
              participantCount={totalParticipants}
            />
          </div>

          {/* Setup Guide - show when Supabase not configured */}
          {!SupabaseRealtimeService.getConnectionStatus().isConfigured && (
            <div className="mb-6">
              <SetupGuide />
            </div>
          )}

          {/* Validation Form */}
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden mb-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-500 px-8 py-6 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Validasi Sertifikat</h1>
              <p className="text-pink-100">Verifikasi keaslian sertifikat peserta</p>
              <div className="mt-2 flex items-center justify-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-300 animate-pulse"
                      : connectionStatus === "connecting"
                        ? "bg-yellow-300 animate-pulse"
                        : connectionStatus === "error"
                          ? "bg-red-300"
                          : "bg-blue-300"
                  }`}
                ></div>
                <span className="text-pink-100 text-sm">
                  {connectionStatus === "connected"
                    ? "Real-Time Connected"
                    : connectionStatus === "connecting"
                      ? "Connecting..."
                      : connectionStatus === "error"
                        ? "Connection Error"
                        : "Local Mode"}
                </span>
              </div>
            </div>

            {/* Form Section */}
            <CardContent className="p-8 bg-white">
              <form onSubmit={handleValidation} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="certificate-number" className="block text-sm font-medium text-gray-700">
                    Nomor Sertifikat
                  </label>
                  <Input
                    id="certificate-number"
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    className="h-12 bg-blue-50 border-blue-100 text-gray-800 rounded-lg focus:border-pink-500 focus:ring-pink-500"
                    placeholder="Contoh: CERT-2024-001"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white rounded-xl shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Memvalidasi...
                    </div>
                  ) : (
                    "Validasi Sekarang"
                  )}
                </Button>
              </form>

              {/* Debug Button */}
              <div className="mt-4 text-center">
                <Button
                  onClick={handleDebug}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="shadow-lg border-0 rounded-2xl overflow-hidden border-l-4 border-l-green-500">
              <CardContent className="p-8 bg-green-50">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 bg-green-100 rounded-full p-2 mr-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-800">Sertifikat Valid</h3>
                    <p className="text-green-600">Sertifikat ini terdaftar dalam database kami.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Nomor Sertifikat</p>
                    <p className="text-lg font-bold text-gray-900">{result.certificate_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tanggal Terbit</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(result.issue_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Nama Peserta</p>
                    <p className="text-lg font-bold text-gray-900">{result.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Nama Kelas</p>
                    <p className="text-lg font-bold text-gray-900">{result.class_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {notFound && (
            <Card className="shadow-lg border-0 rounded-2xl overflow-hidden border-l-4 border-l-red-500">
              <CardContent className="p-8 bg-red-50">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-2 mr-4">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800">Sertifikat Tidak Valid</h3>
                    <p className="text-red-600">Sertifikat tidak ditemukan dalam database kami.</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-gray-700">
                    Pastikan nomor sertifikat yang Anda masukkan sudah benar. Jika masih mengalami masalah, silakan
                    hubungi tim support kami.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Nomor yang dicari: <strong>{certificateNumber}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Info Display */}
          {debugInfo && (
            <Card className="mt-4 shadow-lg border-0 rounded-2xl overflow-hidden border-l-4 border-l-blue-500">
              <CardContent className="p-4 bg-blue-50">
                <h4 className="font-bold text-blue-800 mb-2">Debug Information</h4>
                <div className="text-sm text-blue-700">
                  <p>Total Participants: {debugInfo.debug.total_in_storage}</p>
                  <p>Connection Status: {connectionStatus}</p>
                  <p>Supabase Configured: {debugInfo.status.isConfigured ? "Yes" : "No"}</p>
                  <p>Available Certificates:</p>
                  <ul className="list-disc list-inside ml-4">
                    {debugInfo.debug.certificate_numbers.map((cert: string, index: number) => (
                      <li key={index}>{cert}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 Grazedu - Great Zilenial Education. Semua hak dilindungi.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
