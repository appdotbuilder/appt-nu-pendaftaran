import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, MemberWithRegistrations } from '../../../server/src/schema';

interface MemberDashboardProps {
  user: User;
  onLogout: () => void;
  onRegisterMember: () => void;
}

export function MemberDashboard({ user, onLogout, onRegisterMember }: MemberDashboardProps) {
  const [memberData, setMemberData] = useState<MemberWithRegistrations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemberData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getMemberWithRegistrations.query({ user_id: user.id });
      setMemberData(result);
      setError(null);
    } catch (error) {
      console.error('Failed to load member data:', error);
      setError('Gagal memuat data anggota');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'Active': { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: '✅' },
      'Inactive': { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800', icon: '💤' },
      'Rejected': { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: '❌' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
    
    return (
      <Badge className={config.color}>
        {config.icon} {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'Confirmed': { color: 'bg-green-100 text-green-800', icon: '✅' },
      'Rejected': { color: 'bg-red-100 text-red-800', icon: '❌' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
    
    return (
      <Badge className={config.color}>
        {config.icon} {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🕌</span>
            <div>
              <h1 className="text-xl font-bold text-emerald-800">Dashboard Anggota APPTNU</h1>
              <p className="text-sm text-emerald-600">Selamat datang, {user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-emerald-100 text-emerald-800">
              👤 {user.role}
            </Badge>
            <Button variant="outline" onClick={onLogout}>
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-2 text-emerald-700">Memuat data...</p>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && !memberData && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-emerald-800 mb-4">
                Belum Ada Data Anggota
              </h2>
              <p className="text-emerald-700 mb-6">
                Anda belum melengkapi data keanggotaan. Silakan daftar sebagai anggota APPTNU terlebih dahulu.
              </p>
              <Button
                onClick={onRegisterMember}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                🚀 Daftar Sebagai Anggota
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && memberData && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm">
              <TabsTrigger value="overview">📊 Ringkasan</TabsTrigger>
              <TabsTrigger value="member-info">🏛️ Data Anggota</TabsTrigger>
              <TabsTrigger value="registrations">📋 Riwayat Registrasi</TabsTrigger>
              <TabsTrigger value="documents">📄 Dokumen</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-emerald-800 flex items-center gap-2 text-lg">
                      🎯 Status Keanggotaan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      {getStatusBadge(memberData.member.membership_status)}
                      <p className="text-sm text-emerald-600 mt-2">
                        {memberData.member.university_name}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-emerald-800 flex items-center gap-2 text-lg">
                      📊 Total Registrasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600">
                        {memberData.registrations.length}
                      </div>
                      <p className="text-sm text-emerald-600 mt-1">
                        Registrasi dilakukan
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-emerald-800 flex items-center gap-2 text-lg">
                      📚 Koleksi Buku
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600">
                        {memberData.member.book_collection_count.toLocaleString()}
                      </div>
                      <p className="text-sm text-emerald-600 mt-1">
                        Jumlah koleksi
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-800 flex items-center gap-2">
                    🚀 Tindakan Cepat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={onRegisterMember}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      📝 Registrasi Baru
                    </Button>
                    <Button variant="outline" className="border-emerald-200">
                      📧 Hubungi Admin
                    </Button>
                    <Button variant="outline" className="border-emerald-200">
                      📞 Bantuan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Member Info Tab */}
            <TabsContent value="member-info" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-800 flex items-center gap-2">
                    🏛️ Informasi Institusi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-emerald-800 font-medium">Perguruan Tinggi</Label>
                        <p className="text-emerald-700 mt-1">{memberData.member.university_name}</p>
                      </div>
                      <div>
                        <Label className="text-emerald-800 font-medium">Provinsi</Label>
                        <p className="text-emerald-700 mt-1">{memberData.member.province}</p>
                      </div>
                      <div>
                        <Label className="text-emerald-800 font-medium">Email Institusi</Label>
                        <p className="text-emerald-700 mt-1">{memberData.member.institution_email}</p>
                      </div>
                      <div>
                        <Label className="text-emerald-800 font-medium">Status Akreditasi</Label>
                        <p className="text-emerald-700 mt-1">{memberData.member.accreditation_status}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-emerald-800 font-medium">Kepala Perpustakaan</Label>
                        <p className="text-emerald-700 mt-1">{memberData.member.library_head_name}</p>
                        <p className="text-emerald-600 text-sm">{memberData.member.library_head_phone}</p>
                      </div>
                      <div>
                        <Label className="text-emerald-800 font-medium">PIC (Penanggung Jawab)</Label>
                        <p className="text-emerald-700 mt-1">{memberData.member.pic_name}</p>
                        <p className="text-emerald-600 text-sm">{memberData.member.pic_phone}</p>
                      </div>
                      <div>
                        <Label className="text-emerald-800 font-medium">Repository Status</Label>
                        <Badge className={memberData.member.repository_status === 'Sudah' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {memberData.member.repository_status === 'Sudah' ? '✅' : '⏳'} {memberData.member.repository_status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-emerald-200" />

                  <div>
                    <Label className="text-emerald-800 font-medium">Alamat Institusi</Label>
                    <p className="text-emerald-700 mt-1">{memberData.member.institution_address}</p>
                  </div>

                  {(memberData.member.library_website_url || memberData.member.opac_url) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {memberData.member.library_website_url && (
                        <div>
                          <Label className="text-emerald-800 font-medium">Website Perpustakaan</Label>
                          <a
                            href={memberData.member.library_website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-emerald-600 hover:text-emerald-800 mt-1 underline"
                          >
                            {memberData.member.library_website_url}
                          </a>
                        </div>
                      )}
                      {memberData.member.opac_url && (
                        <div>
                          <Label className="text-emerald-800 font-medium">OPAC URL</Label>
                          <a
                            href={memberData.member.opac_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-emerald-600 hover:text-emerald-800 mt-1 underline"
                          >
                            {memberData.member.opac_url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Registrations Tab */}
            <TabsContent value="registrations" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-800 flex items-center gap-2">
                    📋 Riwayat Registrasi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {memberData.registrations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📋</div>
                      <p className="text-emerald-700">Belum ada riwayat registrasi</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {memberData.registrations.map((registration) => (
                        <div
                          key={registration.id}
                          className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/50"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-blue-100 text-blue-800">
                                  {registration.registration_type === 'Pendaftaran Baru' ? '🆕' : '🔄'} {registration.registration_type}
                                </Badge>
                                {getPaymentStatusBadge(registration.payment_status)}
                              </div>
                              <p className="text-sm text-emerald-600">
                                Dibuat: {registration.created_at.toLocaleDateString('id-ID')}
                              </p>
                              {registration.admin_notes && (
                                <p className="text-sm text-emerald-700">
                                  <strong>Catatan Admin:</strong> {registration.admin_notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              {registration.payment_proof_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(registration.payment_proof_url!, '_blank')}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  📋 Lihat Bukti
                                </Button>
                              )}
                              {registration.receipt_url && (
                                <Button
                                  size="sm"
                                  onClick={() => window.open(registration.receipt_url!, '_blank')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  🧾 Download Kwitansi
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-800 flex items-center gap-2">
                    📄 Dokumen Keanggotaan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Receipts */}
                    <div>
                      <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                        🧾 Kwitansi
                      </h3>
                      <div className="space-y-3">
                        {memberData.registrations.filter(r => r.receipt_url).length === 0 ? (
                          <p className="text-emerald-600 text-sm">Belum ada kwitansi tersedia</p>
                        ) : (
                          memberData.registrations
                            .filter(r => r.receipt_url)
                            .map((registration) => (
                              <Button
                                key={registration.id}
                                variant="outline"
                                className="w-full justify-start border-emerald-200 hover:bg-emerald-50"
                                onClick={() => window.open(registration.receipt_url!, '_blank')}
                              >
                                🧾 Kwitansi {registration.registration_type} ({registration.created_at.getFullYear()})
                              </Button>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Certificates */}
                    <div>
                      <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                        🏆 Sertifikat
                      </h3>
                      <div className="space-y-3">
                        {memberData.registrations.filter(r => r.certificate_url).length === 0 ? (
                          <p className="text-emerald-600 text-sm">Belum ada sertifikat tersedia</p>
                        ) : (
                          memberData.registrations
                            .filter(r => r.certificate_url)
                            .map((registration) => (
                              <Button
                                key={registration.id}
                                className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => window.open(registration.certificate_url!, '_blank')}
                              >
                                🏆 Sertifikat Keanggotaan {registration.created_at.getFullYear()}
                              </Button>
                            ))
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 bg-emerald-200" />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      ℹ️ Informasi Dokumen
                    </h4>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Kwitansi akan tersedia setelah pembayaran dikonfirmasi admin</li>
                      <li>• Sertifikat keanggotaan akan diterbitkan setelah verifikasi lengkap</li>
                      <li>• Hubungi admin jika ada masalah dengan dokumen</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

// Label component for consistent styling
function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      {children}
    </label>
  );
}