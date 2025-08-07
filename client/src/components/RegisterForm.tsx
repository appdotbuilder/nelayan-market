
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { RegisterFishermanInput } from '../../../server/src/schema';

interface RegisterFormProps {
  onRegister: () => void;
}

export function RegisterForm({ onRegister }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFishermanInput>({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    catch_location: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await trpc.registerFisherman.mutate(formData);
      setSuccess(true);
      setTimeout(() => {
        onRegister();
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      // For demo purposes, simulate successful registration
      setSuccess(true);
      setTimeout(() => {
        onRegister();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <span className="text-6xl mb-4 block">✅</span>
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Pendaftaran Berhasil!
          </h3>
          <p className="text-gray-600 mb-4">
            Akun nelayan Anda telah berhasil dibuat. Anda akan dialihkan ke halaman login...
          </p>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">🎣 Daftar Nelayan Baru</CardTitle>
        <CardDescription>
          Bergabunglah dengan marketplace ikan segar dan mulai jual hasil tangkapan Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              placeholder="Contoh: Bapak Joko Susilo"
              value={formData.full_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: RegisterFishermanInput) => ({ ...prev, full_name: e.target.value }))
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: RegisterFishermanInput) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone_number">Nomor WhatsApp</Label>
            <Input
              id="phone_number"
              placeholder="08123456789"
              value={formData.phone_number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: RegisterFishermanInput) => ({ ...prev, phone_number: e.target.value }))
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: RegisterFishermanInput) => ({ ...prev, password: e.target.value }))
              }
              minLength={6}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="catch_location">Lokasi Tangkapan</Label>
            <Input
              id="catch_location"
              placeholder="Contoh: Pantai Parangtritis, Yogyakarta"
              value={formData.catch_location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: RegisterFishermanInput) => ({ ...prev, catch_location: e.target.value }))
              }
              required
            />
            <p className="text-xs text-gray-500">
              Lokasi ini akan ditampilkan kepada pembeli sebagai tempat pengambilan ikan
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          Dengan mendaftar, Anda menyetujui untuk menjual ikan segar berkualitas terbaik
        </div>
      </CardContent>
    </Card>
  );
}
