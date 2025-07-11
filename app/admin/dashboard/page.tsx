"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Upload,
  Edit,
  Trash2,
  LogOut,
  FileSpreadsheet,
  X,
  Download,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useRealtimeParticipants } from "@/hooks/useRealtimeParticipants"
import { ConnectionStatus } from "@/components/connection-status"
import { SupabaseRealtimeService, type Participant } from "@/lib/supabase-realtime"

type SortField = "certificate_number" | "name" | "issue_date" | "class_name"
type SortDirection = "asc" | "desc"

export default function AdminDashboard() {
  const {
    participants,
    isLoading,
    connectionStatus,
    lastUpdated,
    refresh,
    addParticipant,
    updateParticipant,
    deleteParticipant,
  } = useRealtimeParticipants()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [formData, setFormData] = useState({
    certificate_number: "",
    name: "",
    issue_date: "",
    class_name: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  // Updated states for search and sort
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("certificate_number")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const router = useRouter()

  // Filtered and sorted participants
  const filteredAndSortedParticipants = useMemo(() => {
    let filtered = participants

    // Filter by name or class name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = participants.filter(
        (participant) =>
          participant.name.toLowerCase().includes(query) || participant.class_name.toLowerCase().includes(query),
      )
    }

    // Sort participants
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number = a[sortField]
      let bValue: string | number = b[sortField]

      // Handle date sorting
      if (sortField === "issue_date") {
        aValue = new Date(a.issue_date).getTime()
        bValue = new Date(b.issue_date).getTime()
      } else {
        // Convert to string for text comparison
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [participants, searchQuery, sortField, sortDirection])

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field with ascending direction
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-pink-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-pink-600" />
    )
  }

  // Get unique class names for suggestions
  const uniqueClasses = useMemo(() => {
    const classes = participants.map((p) => p.class_name)
    return [...new Set(classes)].sort()
  }, [participants])

  // Quick filter by class
  const handleQuickFilterByClass = (className: string) => {
    setSearchQuery(className)
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log("➕ ADMIN: Adding participant:", formData.certificate_number)

      await addParticipant(formData)

      setIsAddDialogOpen(false)
      setFormData({ certificate_number: "", name: "", issue_date: "", class_name: "" })
      alert("✅ Peserta berhasil ditambahkan!")

      console.log("✅ ADMIN: Successfully added participant")
    } catch (error) {
      console.error("❌ ADMIN: Error adding participant:", error)
      if (error instanceof Error) {
        alert(`❌ Error: ${error.message}`)
      } else {
        alert("❌ Terjadi kesalahan saat menambah peserta")
      }
    }
  }

  const handleEditParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingParticipant) return

    try {
      console.log("✏️ ADMIN: Updating participant:", editingParticipant.id)

      await updateParticipant(editingParticipant.id, formData)

      setEditingParticipant(null)
      setFormData({ certificate_number: "", name: "", issue_date: "", class_name: "" })
      alert("✅ Data peserta berhasil diupdate!")

      console.log("✅ ADMIN: Successfully updated participant")
    } catch (error) {
      console.error("❌ ADMIN: Error updating participant:", error)
      alert("❌ Terjadi kesalahan saat mengupdate peserta")
    }
  }

  const handleDeleteParticipant = async (id: number) => {
    if (!confirm("⚠️ Apakah Anda yakin ingin menghapus peserta ini?")) return

    try {
      console.log("🗑️ ADMIN: Deleting participant:", id)

      await deleteParticipant(id)

      alert("✅ Peserta berhasil dihapus!")
      console.log("✅ ADMIN: Successfully deleted participant")
    } catch (error) {
      console.error("❌ ADMIN: Error deleting participant:", error)
      alert("❌ Terjadi kesalahan saat menghapus peserta")
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setUploadStatus("❌ Pilih file terlebih dahulu")
      return
    }

    setIsUploading(true)
    setUploadStatus("📤 Mengupload dan memproses file...")

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      const startIndex =
        lines[0].toLowerCase().includes("nomor") || lines[0].toLowerCase().includes("certificate") ? 1 : 0

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const columns = line.split(",").map((col) => col.trim().replace(/"/g, ""))

        if (columns.length >= 4) {
          const [certificate_number, name, issue_date, class_name] = columns

          if (certificate_number && name && issue_date && class_name) {
            try {
              await addParticipant({
                certificate_number: certificate_number.trim(),
                name: name.trim(),
                issue_date: issue_date.trim(),
                class_name: class_name.trim(),
              })
              successCount++
            } catch (error) {
              errorCount++
              if (error instanceof Error) {
                errors.push(`${certificate_number}: ${error.message}`)
              } else {
                errors.push(`${certificate_number}: Error processing`)
              }
            }
          }
        }
      }

      setIsUploadDialogOpen(false)
      setFile(null)
      setUploadStatus("")

      let message = `✅ Upload selesai!\n${successCount} peserta berhasil ditambahkan`
      if (errorCount > 0) {
        message += `\n⚠️ ${errorCount} peserta gagal ditambahkan`
        if (errors.length > 0) {
          message += `\n\nDetail error:\n${errors.slice(0, 5).join("\n")}`
          if (errors.length > 5) {
            message += `\n... dan ${errors.length - 5} error lainnya`
          }
        }
      }
      alert(message)
    } catch (error) {
      console.error("❌ ADMIN: Error uploading file:", error)
      setUploadStatus("❌ Terjadi kesalahan saat memproses file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogout = () => {
    router.push("/admin")
  }

  const openEditDialog = (participant: Participant) => {
    setEditingParticipant(participant)
    setFormData({
      certificate_number: participant.certificate_number,
      name: participant.name,
      issue_date: participant.issue_date,
      class_name: participant.class_name,
    })
  }

  const closeAddDialog = () => {
    setIsAddDialogOpen(false)
    setFormData({ certificate_number: "", name: "", issue_date: "", class_name: "" })
  }

  const closeUploadDialog = () => {
    setIsUploadDialogOpen(false)
    setFile(null)
    setUploadStatus("")
  }

  const closeEditDialog = () => {
    setEditingParticipant(null)
    setFormData({ certificate_number: "", name: "", issue_date: "", class_name: "" })
  }

  const downloadTemplate = () => {
    const csvContent = `Nomor Sertifikat,Nama,Tanggal Terbit,Nama Kelas
CERT-2024-004,Ahmad Budi Santoso,2024-03-01,Digital Marketing Fundamentals
CERT-2024-005,Siti Nurhaliza,2024-03-02,Web Development Bootcamp
CERT-2024-006,Rizki Pratama,2024-03-03,Data Science Introduction`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "template_peserta.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleDebugData = () => {
    const status = SupabaseRealtimeService.getConnectionStatus()

    console.log("🐛 DEBUG - Current data:", {
      total: participants.length,
      connectionStatus: status,
      participants: participants.map((p) => ({ id: p.id, certificate_number: p.certificate_number, name: p.name })),
    })

    alert(
      `Debug Info:\nTotal: ${participants.length} participants\nStatus: ${connectionStatus}\nConfigured: ${status.isConfigured}\nCertificates: ${participants.map((p) => p.certificate_number).join(", ")}\n\nCheck console for details`,
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-4 py-2 rounded-lg">
                <h1 className="text-lg font-bold">GRAZEDU</h1>
                <p className="text-xs text-pink-100">Great Zilenial Education</p>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Kelola data peserta sertifikat - Supabase Real-Time</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={handleDebugData}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-600 hover:bg-gray-100 bg-transparent"
              >
                Debug
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Connection Status */}
        <div className="mb-6">
          <ConnectionStatus
            status={connectionStatus}
            isConfigured={SupabaseRealtimeService.getConnectionStatus().isConfigured}
            participantCount={participants.length}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button onClick={() => setIsAddDialogOpen(true)} style={{ backgroundColor: "#cb3689" }}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Peserta
          </Button>

          <Button
            onClick={() => setIsUploadDialogOpen(true)}
            variant="outline"
            style={{ borderColor: "#cb3689", color: "#cb3689" }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>

          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Search and Filter Section */}
        <Card className="shadow-sm border-0 mb-6">
          <CardHeader>
            <CardTitle style={{ color: "#cb3689" }}>Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search by Name or Class */}
              <div className="flex-1">
                <Label htmlFor="search-query" className="text-sm font-medium text-gray-700 mb-2 block">
                  Cari berdasarkan Nama Peserta atau Nama Kelas
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search-query"
                    type="text"
                    placeholder="Ketik nama peserta atau nama kelas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchQuery && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Menampilkan {filteredAndSortedParticipants.length} dari {participants.length} peserta
                    </p>
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery("")}
                      className="text-pink-600 p-0 h-auto text-xs"
                    >
                      ✕ Hapus pencarian
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Class Filter Buttons */}
              {uniqueClasses.length > 0 && (
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Filter Cepat Kelas</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className={`${!searchQuery ? "bg-pink-100 border-pink-300 text-pink-700" : ""}`}
                    >
                      Semua ({participants.length})
                    </Button>
                    {uniqueClasses.slice(0, 3).map((className) => {
                      const count = participants.filter((p) => p.class_name === className).length
                      const isActive = searchQuery === className
                      return (
                        <Button
                          key={className}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickFilterByClass(className)}
                          className={`${isActive ? "bg-pink-100 border-pink-300 text-pink-700" : ""}`}
                        >
                          {className.length > 15 ? `${className.substring(0, 15)}...` : className} ({count})
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participants Table */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle style={{ color: "#cb3689" }}>
              Data Peserta
              {connectionStatus === "connected" && <span className="ml-2 text-green-600 text-sm">🟢 Real-Time</span>}
              {connectionStatus === "disconnected" && <span className="ml-2 text-blue-600 text-sm">🔵 Local</span>}
              {connectionStatus === "error" && <span className="ml-2 text-red-600 text-sm">🔴 Error</span>}
            </CardTitle>
            <CardDescription>
              {searchQuery ? (
                <>
                  Menampilkan {filteredAndSortedParticipants.length} peserta dari pencarian "{searchQuery}"
                  <span className="ml-2 text-gray-500">(Total: {participants.length} peserta)</span>
                </>
              ) : (
                <>Total {participants.length} peserta terdaftar</>
              )}
              {isLoading && <span className="ml-2 text-blue-600">🔄 Loading...</span>}
              {lastUpdated && (
                <span className="ml-2 text-gray-500 text-xs">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString("id-ID")}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Memuat data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("certificate_number")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        <span className="flex items-center gap-2">
                          Nomor Sertifikat
                          {getSortIcon("certificate_number")}
                        </span>
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("name")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        <span className="flex items-center gap-2">
                          Nama
                          {getSortIcon("name")}
                        </span>
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("issue_date")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        <span className="flex items-center gap-2">
                          Tanggal Terbit
                          {getSortIcon("issue_date")}
                        </span>
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("class_name")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        <span className="flex items-center gap-2">
                          Nama Kelas
                          {getSortIcon("class_name")}
                        </span>
                      </Button>
                    </TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {searchQuery ? (
                          <>
                            Tidak ada peserta ditemukan untuk pencarian "{searchQuery}"
                            <br />
                            <Button
                              variant="link"
                              onClick={() => setSearchQuery("")}
                              className="text-pink-600 p-0 h-auto mt-2"
                            >
                              Tampilkan semua peserta
                            </Button>
                          </>
                        ) : (
                          "Belum ada data peserta"
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedParticipants.map((participant) => {
                      // Highlight search terms
                      const highlightText = (text: string, query: string) => {
                        if (!query.trim()) return text
                        const regex = new RegExp(`(${query.trim()})`, "gi")
                        const parts = text.split(regex)
                        return parts.map((part, index) =>
                          regex.test(part) ? (
                            <mark key={index} className="bg-yellow-200 px-1 rounded">
                              {part}
                            </mark>
                          ) : (
                            part
                          ),
                        )
                      }

                      return (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.certificate_number}</TableCell>
                          <TableCell>
                            {searchQuery ? highlightText(participant.name, searchQuery) : participant.name}
                          </TableCell>
                          <TableCell>{new Date(participant.issue_date).toLocaleDateString("id-ID")}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {searchQuery
                                ? highlightText(participant.class_name, searchQuery)
                                : participant.class_name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(participant)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                                onClick={() => handleDeleteParticipant(participant.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Participant Modal */}
        {isAddDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: "#cb3689" }}>
                  Tambah Peserta Baru
                </h2>
                <Button variant="ghost" size="sm" onClick={closeAddDialog}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleAddParticipant} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cert-number">Nomor Sertifikat</Label>
                  <Input
                    id="cert-number"
                    value={formData.certificate_number}
                    onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Peserta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue-date">Tanggal Terbit</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-name">Nama Kelas</Label>
                  <Input
                    id="class-name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1" style={{ backgroundColor: "#cb3689" }}>
                    Tambah Peserta
                  </Button>
                  <Button type="button" variant="outline" onClick={closeAddDialog}>
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload CSV Modal */}
        {isUploadDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: "#cb3689" }}>
                  Upload File CSV
                </h2>
                <Button variant="ghost" size="sm" onClick={closeUploadDialog}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Petunjuk Upload CSV:</p>
                    <ul className="text-sm text-green-700 mt-1 space-y-1">
                      <li>• File harus berformat CSV (.csv)</li>
                      <li>• Download template untuk format yang benar</li>
                      <li>• ✅ Data tersinkronisasi real-time ke semua device</li>
                      <li>• Sistem akan mengecek duplikat nomor sertifikat</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Pilih File CSV</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null)
                      setUploadStatus("")
                    }}
                    required
                  />
                  {file && (
                    <p className="text-sm text-gray-600">
                      File dipilih: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p className="font-semibold mb-2">Format CSV yang diharapkan:</p>
                  <div className="font-mono text-xs bg-white p-2 rounded border">
                    Nomor Sertifikat,Nama,Tanggal Terbit,Nama Kelas
                    <br />
                    CERT-2024-004,Ahmad Budi,2024-03-01,Web Development
                    <br />
                    CERT-2024-005,Siti Nurhaliza,2024-03-02,Digital Marketing
                  </div>
                </div>

                {uploadStatus && (
                  <div
                    className={`p-3 rounded text-sm ${
                      uploadStatus.includes("❌") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {uploadStatus}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    style={{ backgroundColor: "#cb3689" }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      "Mengupload..."
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Upload CSV
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeUploadDialog}>
                    Batal
                  </Button>
                </div>
              </form>

              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="w-full border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template CSV
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Participant Modal */}
        {editingParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: "#cb3689" }}>
                  Edit Peserta
                </h2>
                <Button variant="ghost" size="sm" onClick={closeEditDialog}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleEditParticipant} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cert-number">Nomor Sertifikat</Label>
                  <Input
                    id="edit-cert-number"
                    value={formData.certificate_number}
                    onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Peserta</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-issue-date">Tanggal Terbit</Label>
                  <Input
                    id="edit-issue-date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-class-name">Nama Kelas</Label>
                  <Input
                    id="edit-class-name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1" style={{ backgroundColor: "#cb3689" }}>
                    Simpan Perubahan
                  </Button>
                  <Button type="button" variant="outline" onClick={closeEditDialog}>
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
