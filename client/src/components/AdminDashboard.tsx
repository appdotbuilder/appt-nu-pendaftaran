import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { User, Member, Registration, UpdatePaymentStatusInput, UploadDocumentInput } from '../../../server/src/schema';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Payment status update form
  const [paymentUpdate, setPaymentUpdate] = useState<UpdatePaymentStatusInput>({
    registration_id: 0,
    payment_status: 'Pending',
    admin_notes: null
  });

  // Document upload form
  const [documentUpload, setDocumentUpload] = useState<UploadDocumentInput>({
    registration_id: 0,
    document_type: 'receipt',
    document_url: ''
  });

  const loadMembers = useCallback(async () => {
    try {
      const result = await trpc.getAllMembers.query();
      setMembers(result);
    } catch (error) {
      console.error('Failed to load members:', error);
      setError('Gagal memuat data anggota');
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    try {
      const result = await trpc.getAllRegistrations.query();
      setRegistrations(result);
    } catch (error) {
      console.error('Failed to load registrations:', error);
      setError('Gagal memuat data registrasi');
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadMembers(), loadRegistrations()]);
    setIsLoading(false);
  }, [loadMembers, loadRegistrations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdatePaymentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await trpc.updatePaymentStatus.mutate(paymentUpdate);
      await loadRegistrations(); // Reload registrations
      alert('Status pembayaran berhasil diperbarui!');
    } catch (error) {
      console.error('Failed to update payment status:', error);
      alert('Gagal memperbarui status pembayaran');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await trpc.uploadDocument.mutate(documentUpload);
      await loadRegistrations(); // Reload registrations
      alert('Dokumen berhasil diupload!');
      setDocumentUpload({
        registration_id: 0,
        document_type: 'receipt',
        document_url: ''
      });
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Gagal mengupload dokumen');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string, type: 'membership' | 'payment' = 'membership') => {
    if (type === 'membership') {
      const statusConfig = {
        'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
        'Active': { color: 'bg-green-100 text-green-800', icon: '✅' },
        'Inactive': { color: 'bg-gray-100 text-gray-800', icon: '💤' },
        'Rejected': { color: 'bg-red-100 text-red-800', icon: '❌' }
      };
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
      return <Badge className={config.color}>{config.icon} {status}</Badge>;
    } else {
      const statusConfig = {
        'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
        'Confirmed': { color: 'bg-green-100 text-green-800', icon: '✅' },
        'Rejected': { color: 'bg-red-100 text-red-800', icon: '❌' }
      };
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
      return <Badge className={config.color}>{config.icon} {status}</Badge>;
    }
  };

  const openPaymentDialog = (registration: Registration) => {
    setPaymentUpdate({
      registration_id: registration.id,
      payment_status: registration.payment_status,
      admin_notes: registration.admin_notes || ''
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🕌</span>
            <div>
              <h1 className="text-xl font-bold text-emerald-800">Admin Dashboard APPTNU</h1>
              <p className="text-sm text-emerald-600">Panel administrasi keanggotaan</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-blue-100 text-blue-800">
              👨‍💼 Administrator
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

        {!isLoading && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-emerald-800 flex items-center gap-2 text-lg">
                    👥 Total Anggota
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">
                      {members.length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-800 flex items-center gap-2 text-lg">
                    ✅ Anggota Aktif
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {members.filter(m => m.membership_status === 'Active').length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-yellow-800 flex items-center gap-2 text-lg">
                    ⏳ Menunggu Verifikasi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {registrations.filter(r => r.payment_status === 'Pending').length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-purple-800 flex items-center gap-2 text-lg">
                    📋 Total Registrasi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {registrations.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="members" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur-sm">
                <TabsTrigger value="members">👥 Kelola Anggota</TabsTrigger>
                <TabsTrigger value="registrations">📋 Kelola Registrasi</TabsTrigger>
                <TabsTrigger value="documents">📄 Kelola Dokumen</TabsTrigger>
              </TabsList>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      👥 Daftar Anggota
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Perguruan Tinggi</TableHead>
                            <TableHead>Provinsi</TableHead>
                            <TableHead>Kepala Perpustakaan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tgl. Daftar</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {member.university_name}
                              </TableCell>
                              <TableCell>{member.province}</TableCell>
                              <TableCell>
                                <div>
                                  <p>{member.library_head_name}</p>
                                  <p className="text-sm text-gray-500">{member.library_head_phone}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(member.membership_status)}
                              </TableCell>
                              <TableCell>
                                {member.created_at.toLocaleDateString('id-ID')}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    👁️ Detail
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    ✏️ Edit
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Registrations Tab */}
              <TabsContent value="registrations" className="space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      📋 Daftar Registrasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Status Pembayaran</TableHead>
                            <TableHead>Bukti Transfer</TableHead>
                            <TableHead>Tgl. Registrasi</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrations.map((registration) => (
                            <TableRow key={registration.id}>
                              <TableCell className="font-medium">
                                #{registration.id}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-blue-100 text-blue-800">
                                  {registration.registration_type === 'Pendaftaran Baru' ? '🆕' : '🔄'} {registration.registration_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(registration.payment_status, 'payment')}
                              </TableCell>
                              <TableCell>
                                {registration.payment_proof_url ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(registration.payment_proof_url!, '_blank')}
                                  >
                                    👁️ Lihat
                                  </Button>
                                ) : (
                                  <span className="text-gray-400">Tidak ada</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {registration.created_at.toLocaleDateString('id-ID')}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openPaymentDialog(registration)}
                                      >
                                        💳 Update Status
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Update Status Pembayaran</DialogTitle>
                                      </DialogHeader>
                                      <form onSubmit={handleUpdatePaymentStatus} className="space-y-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="payment_status">Status Pembayaran</Label>
                                          <Select
                                            value={paymentUpdate.payment_status}
                                            onValueChange={(value: 'Pending' | 'Confirmed' | 'Rejected') => 
                                              setPaymentUpdate(prev => ({ ...prev, payment_status: value }))
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Pending">⏳ Pending</SelectItem>
                                              <SelectItem value="Confirmed">✅ Confirmed</SelectItem>
                                              <SelectItem value="Rejected">❌ Rejected</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="admin_notes">Catatan Admin (Opsional)</Label>
                                          <Textarea
                                            id="admin_notes"
                                            value={paymentUpdate.admin_notes || ''}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                                              setPaymentUpdate(prev => ({ ...prev, admin_notes: e.target.value || null }))
                                            }
                                            placeholder="Tambahkan catatan jika diperlukan..."
                                          />
                                        </div>
                                        <Button type="submit" disabled={isUpdating}>
                                          {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </Button>
                                      </form>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      📄 Upload Dokumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUploadDocument} className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="doc_registration_id">ID Registrasi</Label>
                        <Select
                          value={documentUpload.registration_id.toString() || ''}
                          onValueChange={(value: string) => 
                            setDocumentUpload(prev => ({ ...prev, registration_id: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih registrasi" />
                          </SelectTrigger>
                          <SelectContent>
                            {registrations.map((reg) => (
                              <SelectItem key={reg.id} value={reg.id.toString()}>
                                #{reg.id} - {reg.registration_type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="document_type">Jenis Dokumen</Label>
                        <Select
                          value={documentUpload.document_type}
                          onValueChange={(value: 'receipt' | 'certificate') => 
                            setDocumentUpload(prev => ({ ...prev, document_type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="receipt">🧾 Kwitansi</SelectItem>
                            <SelectItem value="certificate">🏆 Sertifikat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="document_url">URL Dokumen</Label>
                        <Input
                          id="document_url"
                          type="url"
                          value={documentUpload.document_url}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setDocumentUpload(prev => ({ ...prev, document_url: e.target.value }))
                          }
                          placeholder="https://drive.google.com/..."
                          required
                        />
                      </div>

                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? 'Mengupload...' : 'Upload Dokumen'}
                      </Button>
                    </form>

                    <div className="mt-8">
                      <h3 className="font-semibold text-emerald-800 mb-4">Dokumen yang Sudah Diupload</h3>
                      <div className="space-y-2">
                        {registrations
                          .filter(r => r.receipt_url || r.certificate_url)
                          .map((registration) => (
                            <div key={registration.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                              <div>
                                <p className="font-medium">Registrasi #{registration.id}</p>
                                <div className="flex gap-2 mt-1">
                                  {registration.receipt_url && (
                                    <Badge className="bg-green-100 text-green-800">🧾 Kwitansi</Badge>
                                  )}
                                  {registration.certificate_url && (
                                    <Badge className="bg-blue-100 text-blue-800">🏆 Sertifikat</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {registration.receipt_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(registration.receipt_url!, '_blank')}
                                  >
                                    👁️ Kwitansi
                                  </Button>
                                )}
                                {registration.certificate_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(registration.certificate_url!, '_blank')}
                                  >
                                    👁️ Sertifikat
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}