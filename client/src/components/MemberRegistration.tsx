import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { User, CreateMemberInput, CreateRegistrationInput } from '../../../server/src/schema';

interface MemberRegistrationProps {
  currentUser: User | null;
  onComplete: () => void;
  onBack: () => void;
}

export function MemberRegistration({ currentUser, onComplete, onBack }: MemberRegistrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'member' | 'registration'>('member');
  
  const [memberData, setMemberData] = useState<CreateMemberInput>({
    user_id: currentUser?.id || 0,
    university_name: '',
    library_head_name: '',
    library_head_phone: '',
    pic_name: '',
    pic_phone: '',
    institution_address: '',
    province: 'Jawa Timur',
    institution_email: '',
    library_website_url: null,
    opac_url: null,
    repository_status: 'Belum',
    book_collection_count: 0,
    accreditation_status: 'Belum Akreditasi'
  });

  const [registrationData, setRegistrationData] = useState<CreateRegistrationInput>({
    member_id: 0,
    registration_type: 'Pendaftaran Baru',
    payment_proof_url: null
  });

  const handleMemberDataChange = (field: keyof CreateMemberInput, value: string | number | null) => {
    setMemberData((prev: CreateMemberInput) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegistrationDataChange = (field: keyof CreateRegistrationInput, value: string | number | null) => {
    setRegistrationData((prev: CreateRegistrationInput) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const member = await trpc.createMember.mutate(memberData);
      setRegistrationData(prev => ({ ...prev, member_id: member.id }));
      setStep('registration');
      setSuccess('Data anggota berhasil disimpan! Silakan lanjut ke tahap pendaftaran.');
    } catch (error) {
      console.error('Member creation error:', error);
      setError('Gagal menyimpan data anggota. Pastikan semua field telah diisi dengan benar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await trpc.createRegistration.mutate(registrationData);
      setSuccess('Pendaftaran berhasil! Silakan lakukan pembayaran sesuai instruksi.');
      setTimeout(() => onComplete(), 2000);
    } catch (error) {
      console.error('Registration creation error:', error);
      setError('Gagal menyimpan data pendaftaran. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Member registration step
  if (step === 'member') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">
            📝 Pendaftaran Anggota APPTNU
          </h1>
          <p className="text-emerald-700">
            Lengkapi data perpustakaan dan institusi Anda
          </p>
          <div className="flex justify-center mt-4">
            <Badge className="bg-emerald-100 text-emerald-800 px-6 py-2">
              Langkah 1 dari 2: Data Anggota
            </Badge>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800 flex items-center gap-2">
              🏛️ Informasi Institusi dan Perpustakaan
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleMemberSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Basic Institution Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="university_name" className="text-emerald-800 font-medium">
                    Nama Perguruan Tinggi *
                  </Label>
                  <Input
                    id="university_name"
                    value={memberData.university_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleMemberDataChange('university_name', e.target.value)
                    }
                    placeholder="Universitas/Institut/STAIN..."
                    required
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province" className="text-emerald-800 font-medium">
                    Provinsi *
                  </Label>
                  <Select
                    value={memberData.province}
                    onValueChange={(value: 'Jawa Timur' | 'Jawa Barat' | 'Jawa Tengah') => 
                      handleMemberDataChange('province', value)
                    }
                  >
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jawa Timur">🌏 Jawa Timur</SelectItem>
                      <SelectItem value="Jawa Barat">🌏 Jawa Barat</SelectItem>
                      <SelectItem value="Jawa Tengah">🌏 Jawa Tengah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution_address" className="text-emerald-800 font-medium">
                  Alamat Lengkap Institusi *
                </Label>
                <Textarea
                  id="institution_address"
                  value={memberData.institution_address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    handleMemberDataChange('institution_address', e.target.value)
                  }
                  placeholder="Jalan, Kelurahan, Kecamatan, Kabupaten/Kota, Kode Pos"
                  required
                  className="border-emerald-200 focus:border-emerald-500 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution_email" className="text-emerald-800 font-medium">
                  Email Institusi *
                </Label>
                <Input
                  id="institution_email"
                  type="email"
                  value={memberData.institution_email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleMemberDataChange('institution_email', e.target.value)
                  }
                  placeholder="library@university.ac.id"
                  required
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>

              <Separator className="bg-emerald-200" />

              {/* Library Head Information */}
              <div>
                <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                  👨‍💼 Informasi Kepala Perpustakaan
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="library_head_name" className="text-emerald-800 font-medium">
                      Nama Kepala Perpustakaan *
                    </Label>
                    <Input
                      id="library_head_name"
                      value={memberData.library_head_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleMemberDataChange('library_head_name', e.target.value)
                      }
                      placeholder="Dr. Nama Kepala Perpustakaan"
                      required
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="library_head_phone" className="text-emerald-800 font-medium">
                      No. HP/WhatsApp Kepala Perpustakaan *
                    </Label>
                    <Input
                      id="library_head_phone"
                      value={memberData.library_head_phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleMemberDataChange('library_head_phone', e.target.value)
                      }
                      placeholder="08xxxxxxxxxx"
                      required
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-emerald-200" />

              {/* PIC Information */}
              <div>
                <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                  👤 Informasi PIC (Penanggung Jawab)
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pic_name" className="text-emerald-800 font-medium">
                      Nama PIC *
                    </Label>
                    <Input
                      id="pic_name"
                      value={memberData.pic_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleMemberDataChange('pic_name', e.target.value)
                      }
                      placeholder="Nama Penanggung Jawab"
                      required
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pic_phone" className="text-emerald-800 font-medium">
                      No. HP/WhatsApp PIC *
                    </Label>
                    <Input
                      id="pic_phone"
                      value={memberData.pic_phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleMemberDataChange('pic_phone', e.target.value)
                      }
                      placeholder="08xxxxxxxxxx"
                      required
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-emerald-200" />

              {/* Library Details */}
              <div>
                <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                  📚 Detail Perpustakaan
                </h3>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="library_website_url" className="text-emerald-800 font-medium">
                        URL Website Perpustakaan
                      </Label>
                      <Input
                        id="library_website_url"
                        type="url"
                        value={memberData.library_website_url || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleMemberDataChange('library_website_url', e.target.value || null)
                        }
                        placeholder="https://library.university.ac.id"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="opac_url" className="text-emerald-800 font-medium">
                        URL Otomasi/OPAC/Digital Library
                      </Label>
                      <Input
                        id="opac_url"
                        type="url"
                        value={memberData.opac_url || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleMemberDataChange('opac_url', e.target.value || null)
                        }
                        placeholder="https://opac.university.ac.id"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="repository_status" className="text-emerald-800 font-medium">
                        Repository Terhubung Indonesia Onesearch? *
                      </Label>
                      <Select
                        value={memberData.repository_status}
                        onValueChange={(value: 'Belum' | 'Sudah') => 
                          handleMemberDataChange('repository_status', value)
                        }
                      >
                        <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Belum">❌ Belum</SelectItem>
                          <SelectItem value="Sudah">✅ Sudah</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="book_collection_count" className="text-emerald-800 font-medium">
                        Jumlah Koleksi Buku *
                      </Label>
                      <Input
                        id="book_collection_count"
                        type="number"
                        value={memberData.book_collection_count}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleMemberDataChange('book_collection_count', parseInt(e.target.value) || 0)
                        }
                        placeholder="1000"
                        required
                        min="0"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accreditation_status" className="text-emerald-800 font-medium">
                        Status Akreditasi *
                      </Label>
                      <Select
                        value={memberData.accreditation_status}
                        onValueChange={(value: 'Akreditasi A' | 'Akreditasi B' | 'Belum Akreditasi') => 
                          handleMemberDataChange('accreditation_status', value)
                        }
                      >
                        <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Akreditasi A">🏆 Akreditasi A</SelectItem>
                          <SelectItem value="Akreditasi B">🥈 Akreditasi B</SelectItem>
                          <SelectItem value="Belum Akreditasi">⏳ Belum Akreditasi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-emerald-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  ← Kembali
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                >
                  {isLoading ? '⏳ Menyimpan...' : 'Lanjut ke Pendaftaran →'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration step
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-800 mb-2">
          💳 Pendaftaran Keanggotaan
        </h1>
        <p className="text-emerald-700">
          Pilih jenis pendaftaran dan upload bukti pembayaran
        </p>
        <div className="flex justify-center mt-4">
          <Badge className="bg-emerald-100 text-emerald-800 px-6 py-2">
            Langkah 2 dari 2: Registrasi & Pembayaran
          </Badge>
        </div>
      </div>

      <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            💰 Informasi Pendaftaran dan Pembayaran
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleRegistrationSubmit} className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="registration_type" className="text-emerald-800 font-medium">
                Jenis Pendaftaran *
              </Label>
              <Select
                value={registrationData.registration_type || 'Pendaftaran Baru'}
                onValueChange={(value: 'Pendaftaran Baru' | 'Perpanjangan') => 
                  handleRegistrationDataChange('registration_type', value)
                }
              >
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendaftaran Baru">🆕 Pendaftaran Baru</SelectItem>
                  <SelectItem value="Perpanjangan">🔄 Perpanjangan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                💳 Instruksi Pembayaran
              </h3>
              <div className="space-y-2 text-blue-700 text-sm">
                <p><strong>Bank:</strong> Bank Mandiri</p>
                <p><strong>No. Rekening:</strong> 1234567890</p>
                <p><strong>Atas Nama:</strong> APPTNU</p>
                <p><strong>Jumlah:</strong> Rp 500.000 (Pendaftaran Baru) / Rp 300.000 (Perpanjangan)</p>
              </div>
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  📝 Setelah transfer, upload bukti pembayaran di bawah ini untuk konfirmasi
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_proof_url" className="text-emerald-800 font-medium">
                URL Bukti Transfer
              </Label>
              <Input
                id="payment_proof_url"
                type="url"
                value={registrationData.payment_proof_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleRegistrationDataChange('payment_proof_url', e.target.value || null)
                }
                placeholder="https://drive.google.com/... atau link file bukti transfer"
                className="border-emerald-200 focus:border-emerald-500"
              />
              <p className="text-sm text-emerald-600">
                Upload bukti transfer ke Google Drive/cloud storage dan masukkan link-nya di sini
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-emerald-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('member')}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                ← Kembali ke Data Anggota
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                {isLoading ? '⏳ Mengirim...' : '🚀 Selesaikan Pendaftaran'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}