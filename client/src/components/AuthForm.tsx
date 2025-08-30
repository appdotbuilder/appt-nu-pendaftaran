import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, LoginInput } from '../../../server/src/schema';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSuccess: (user: User, token?: string) => void;
  onToggleMode: () => void;
  onBack: () => void;
}

export function AuthForm({ mode, onSuccess, onToggleMode, onBack }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    role: 'Member'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const user = await trpc.createUser.mutate(formData);
        onSuccess(user);
      } else {
        const loginData: LoginInput = {
          email: formData.email,
          password: formData.password
        };
        const response = await trpc.login.mutate(loginData);
        onSuccess(response.user, response.token);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(mode === 'login' 
        ? 'Email atau password tidak valid' 
        : 'Gagal membuat akun. Email mungkin sudah terdaftar.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserInput, value: string) => {
    setFormData((prev: CreateUserInput) => ({ 
      ...prev, 
      [field]: field === 'role' ? value as 'Member' | 'Admin' : value 
    }));
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-emerald-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-emerald-800">
          {mode === 'login' ? '🔑 Masuk ke Akun' : '🚀 Daftar Akun Baru'}
        </CardTitle>
        <CardDescription className="text-emerald-600">
          {mode === 'login' 
            ? 'Masuk untuk mengakses dashboard keanggotaan Anda'
            : 'Buat akun baru untuk memulai proses keanggotaan'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-emerald-800 font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('email', e.target.value)
              }
              placeholder="email@institution.edu"
              required
              className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-emerald-800 font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('password', e.target.value)
              }
              placeholder="Masukkan password"
              required
              minLength={8}
              className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
            {mode === 'register' && (
              <p className="text-sm text-emerald-600">
                Password minimal 8 karakter
              </p>
            )}
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="role" className="text-emerald-800 font-medium">
                Tipe Akun
              </Label>
              <Select
                value={formData.role || 'Member'}
                onValueChange={(value: 'Member' | 'Admin') => handleInputChange('role', value)}
              >
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">👤 Anggota/Calon Anggota</SelectItem>
                  <SelectItem value="Admin">👨‍💼 Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-emerald-600">
                Pilih "Anggota" untuk pendaftaran keanggotaan
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5"
          >
            {isLoading 
              ? '⏳ Memproses...' 
              : mode === 'login' 
                ? '🔑 Masuk' 
                : '🚀 Daftar Akun'
            }
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t border-emerald-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onToggleMode}
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
            >
              {mode === 'login' 
                ? '✨ Belum punya akun? Daftar' 
                : '🔑 Sudah punya akun? Masuk'
              }
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              ← Kembali
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}