"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, CheckCircle, Eye } from "lucide-react"
import { useState } from "react"

export function SetupGuide() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null)
  const [showEnvDetails, setShowEnvDetails] = useState(false)

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const envTemplate = `# Tambahkan ke file .env.local di root project
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

  const sqlScript = `-- Jalankan di Supabase SQL Editor
CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  certificate_number VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk pencarian lebih cepat
CREATE INDEX IF NOT EXISTS idx_participants_certificate_number 
ON participants(certificate_number);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Policy untuk mengizinkan semua operasi
CREATE POLICY "Allow all operations on participants" ON participants
FOR ALL USING (true) WITH CHECK (true);

-- Insert data contoh
INSERT INTO participants (certificate_number, name, issue_date, class_name) VALUES
('CERT-2024-001', 'John Doe', '2024-01-15', 'Web Development Fundamentals'),
('CERT-2024-002', 'Jane Smith', '2024-01-20', 'React Advanced Course'),
('CERT-2024-003', 'Ahmad Rahman', '2024-02-01', 'Digital Marketing Strategy')
ON CONFLICT (certificate_number) DO NOTHING;`

  return (
    <Card className="shadow-lg border-0 rounded-2xl overflow-hidden border-l-4 border-l-blue-500">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-blue-800 flex items-center">🚀 Setup Supabase Real-Time (5 menit)</CardTitle>
        <p className="text-blue-600 text-sm mt-2">
          Ikuti langkah-langkah berikut untuk mengaktifkan sinkronisasi real-time
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Step 1 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900">Buat Akun Supabase (Gratis)</h3>
          </div>
          <div className="ml-10 space-y-3">
            <p className="text-gray-700">• Buka supabase.com dan klik "Start your project"</p>
            <p className="text-gray-700">• Daftar dengan GitHub/Google (gratis)</p>
            <p className="text-gray-700">• Klik "New Project" dan beri nama project</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://supabase.com", "_blank")}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Buka Supabase.com
            </Button>
          </div>
        </div>

        {/* Step 2 - Detailed Environment Variables */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900">Ambil Environment Variables</h3>
          </div>
          <div className="ml-10 space-y-4">
            {/* Detailed Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">📍 Cara Menemukan Environment Variables:</h4>
              <ol className="text-yellow-700 text-sm space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="font-bold">1.</span>
                  <span>Di Supabase dashboard, klik project Anda</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">2.</span>
                  <span>
                    Di sidebar kiri, klik <strong>"Settings"</strong> (ikon gear ⚙️)
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">3.</span>
                  <span>
                    Klik <strong>"API"</strong> di menu Settings
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">4.</span>
                  <span>
                    Scroll ke bawah, cari section <strong>"Project API keys"</strong>
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">5.</span>
                  <span>
                    Copy <strong>"Project URL"</strong> dan <strong>"anon public"</strong> key
                  </span>
                </li>
              </ol>
            </div>

            {/* Visual Guide Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEnvDetails(!showEnvDetails)}
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showEnvDetails ? "Sembunyikan" : "Lihat"} Contoh Screenshot
            </Button>

            {/* Screenshot Guide */}
            {showEnvDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">🖼️ Lokasi Environment Variables:</h4>
                <div className="space-y-3 text-green-700 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold mb-2">Di halaman Settings → API, Anda akan melihat:</p>
                    <div className="font-mono text-xs bg-gray-100 p-2 rounded">
                      <p>
                        <strong>Project URL:</strong>
                      </p>
                      <p className="text-blue-600">https://abcdefghijk.supabase.co</p>
                      <br />
                      <p>
                        <strong>API Keys:</strong>
                      </p>
                      <p>
                        <strong>anon public:</strong>
                      </p>
                      <p className="text-blue-600 break-all">
                        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
                      </p>
                    </div>
                  </div>
                  <p className="text-green-600">✅ Copy kedua nilai ini dan paste ke template di bawah</p>
                </div>
              </div>
            )}

            {/* Environment Template */}
            <div>
              <p className="text-gray-700 mb-2">
                <strong>Buat file .env.local</strong> di root project dan isi dengan:
              </p>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                <pre>{envTemplate}</pre>
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(envTemplate, 2)}
                  className="border-green-300 text-green-600 hover:bg-green-50"
                >
                  {copiedStep === 2 ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiedStep === 2 ? "Copied!" : "Copy Template"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://supabase.com/dashboard/project/_/settings/api", "_blank")}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka Settings API
                </Button>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Penting:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                <li>
                  • Ganti <code>your-project-id</code> dengan ID project Anda
                </li>
                <li>
                  • Ganti <code>eyJhbGciOiJIUzI1NiI...</code> dengan anon key lengkap
                </li>
                <li>• File .env.local harus di root project (sejajar dengan package.json)</li>
                <li>• Jangan commit file .env.local ke Git!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900">Jalankan SQL Script</h3>
          </div>
          <div className="ml-10 space-y-3">
            <p className="text-gray-700">
              • Di Supabase dashboard → <strong>SQL Editor</strong>
            </p>
            <p className="text-gray-700">
              • Klik <strong>"New query"</strong>
            </p>
            <p className="text-gray-700">
              • Copy-paste script di bawah dan klik <strong>"Run"</strong>
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-xs max-h-48 overflow-y-auto">
              <pre>{sqlScript}</pre>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(sqlScript, 3)}
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                {copiedStep === 3 ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiedStep === 3 ? "Copied!" : "Copy SQL"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://supabase.com/dashboard/project/_/sql", "_blank")}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Buka SQL Editor
              </Button>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <h3 className="font-semibold text-gray-900">Restart Development Server</h3>
          </div>
          <div className="ml-10 space-y-2">
            <p className="text-gray-700">Stop server (Ctrl+C) dan jalankan ulang:</p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              <pre>npm run dev</pre>
            </div>
            <p className="text-gray-600 text-sm">Server perlu di-restart agar environment variables terbaca</p>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-semibold">Setelah setup selesai:</p>
          </div>
          <ul className="text-green-700 text-sm space-y-1 ml-7">
            <li>• Status akan berubah menjadi "🟢 Real-Time Connected"</li>
            <li>• Data tersinkronisasi real-time di semua device</li>
            <li>• Multi-user collaboration aktif</li>
            <li>• Backup otomatis ke cloud</li>
            <li>• Bisa diakses dari mana saja</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🔧 Troubleshooting:</h4>
          <div className="text-blue-700 text-sm space-y-2">
            <p>
              <strong>Masih "localStorage Mode"?</strong>
            </p>
            <ul className="ml-4 space-y-1">
              <li>• Pastikan file .env.local ada di root project</li>
              <li>• Cek format URL: harus https://xxx.supabase.co</li>
              <li>• Cek anon key: harus dimulai dengan eyJ</li>
              <li>• Restart development server</li>
            </ul>
            <p className="mt-3">
              <strong>Butuh bantuan?</strong> Klik tombol Debug untuk info detail
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
