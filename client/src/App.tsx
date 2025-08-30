import { useState, useEffect, useCallback } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { MemberRegistration } from '@/components/MemberRegistration';
import { MemberDashboard } from '@/components/MemberDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Using type-only imports for better TypeScript compliance
import type { User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'auth' | 'register' | 'dashboard' | 'admin'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Check for stored auth token on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('apptnu_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setCurrentView(user.role === 'Admin' ? 'admin' : 'dashboard');
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('apptnu_user');
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentView('home');
    localStorage.removeItem('apptnu_user');
    localStorage.removeItem('apptnu_token');
  }, []);

  const handleAuthSuccess = useCallback((user: User, token?: string) => {
    setCurrentUser(user);
    localStorage.setItem('apptnu_user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('apptnu_token', token);
    }
    setCurrentView(user.role === 'Admin' ? 'admin' : 'dashboard');
  }, []);

  const handleRegistrationComplete = useCallback(() => {
    // After member registration is complete, redirect to dashboard
    setCurrentView('dashboard');
  }, []);

  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">🕌 APPTNU</h1>
            <p className="text-emerald-700">Asosiasi Perpustakaan Perguruan Tinggi Nahdatul Ulama</p>
          </div>
          <AuthForm
            mode={authMode}
            onSuccess={handleAuthSuccess}
            onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            onBack={() => setCurrentView('home')}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <MemberRegistration
          currentUser={currentUser}
          onComplete={handleRegistrationComplete}
          onBack={() => setCurrentView(currentUser ? 'dashboard' : 'home')}
        />
      </div>
    );
  }

  if (currentView === 'dashboard' && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <MemberDashboard
          user={currentUser}
          onLogout={handleLogout}
          onRegisterMember={() => setCurrentView('register')}
        />
      </div>
    );
  }

  if (currentView === 'admin' && currentUser?.role === 'Admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <AdminDashboard
          user={currentUser}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // Home page
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🕌</span>
            <div>
              <h1 className="text-xl font-bold text-emerald-800">APPTNU</h1>
              <p className="text-sm text-emerald-600">Sistem Keanggotaan Digital</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  {currentUser.role === 'Admin' ? '👨‍💼 Admin' : '👤 ' + currentUser.email}
                </Badge>
                <Button
                  onClick={() => setCurrentView(currentUser.role === 'Admin' ? 'admin' : 'dashboard')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Dashboard
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Keluar
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setCurrentView('auth')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Login / Daftar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-emerald-800 mb-6">
              Selamat Datang di Portal APPTNU
            </h1>
            <p className="text-lg text-emerald-700 mb-8">
              Asosiasi Perpustakaan Perguruan Tinggi Nahdatul Ulama - 
              Sistem Pendaftaran dan Perpanjangan Keanggotaan Digital
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setCurrentView('auth')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                🚀 Mulai Pendaftaran
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView('auth')}
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                📋 Login Anggota
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/90 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                📝 Pendaftaran Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700">
                Daftar atau perpanjang keanggotaan dengan mudah melalui form online yang lengkap
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                💳 Pembayaran Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700">
                Upload bukti transfer pembayaran dan dapatkan konfirmasi dari admin
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                🏆 Sertifikat Digital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700">
                Download kwitansi dan sertifikat keanggotaan setelah pembayaran dikonfirmasi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                📊 Dashboard Anggota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700">
                Pantau status keanggotaan, riwayat pembayaran, dan unduh dokumen
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                🌏 Multi Provinsi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700">
                Melayani perguruan tinggi di Jawa Timur, Jawa Barat, dan Jawa Tengah
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                🔐 Keamanan Terjamin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700">
                Sistem autentikasi yang aman dengan role-based access control
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Information Section */}
        <section className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="text-center text-emerald-800 text-2xl">
                📋 Persyaratan Keanggotaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-emerald-800 mb-3">📄 Data yang Diperlukan:</h3>
                  <ul className="space-y-2 text-emerald-700">
                    <li>• Nama Perguruan Tinggi</li>
                    <li>• Identitas Kepala Perpustakaan</li>
                    <li>• Identitas PIC (Penanggung Jawab)</li>
                    <li>• Alamat dan Kontak Institusi</li>
                    <li>• Informasi Koleksi Perpustakaan</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-800 mb-3">💰 Pembayaran:</h3>
                  <ul className="space-y-2 text-emerald-700">
                    <li>• Upload bukti transfer</li>
                    <li>• Konfirmasi manual oleh admin</li>
                    <li>• Kwitansi resmi tersedia</li>
                    <li>• Sertifikat keanggotaan digital</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-800 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-2xl">🕌</span>
              <h3 className="text-xl font-bold">APPTNU</h3>
            </div>
            <p className="text-emerald-200 mb-4">
              Asosiasi Perpustakaan Perguruan Tinggi Nahdatul Ulama
            </p>
            <p className="text-emerald-300 text-sm">
              © 2024 APPTNU. Semua hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;