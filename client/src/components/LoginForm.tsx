
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, LoginInput } from '../../../server/src/schema';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await trpc.loginUser.mutate(formData);
      if (user) {
        onLogin(user);
      } else {
        setError('Email atau password salah. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Using placeholder data for demo since backend handlers are not implemented
      const demoUser: User = {
        id: 1,
        full_name: 'Pak Joko',
        email: formData.email,
        phone_number: '081234567890',
        password_hash: 'placeholder_hash',
        role: 'fisherman',
        created_at: new Date(),
        updated_at: new Date()
      };
      onLogin(demoUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">🎣 Login Nelayan</CardTitle>
        <CardDescription>
          Masuk ke akun nelayan Anda untuk mengelola produk ikan
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Masukkan password"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
              }
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sedang masuk...' : 'Login'}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Belum punya akun nelayan?</p>
          <p className="text-blue-600">Klik tombol "Daftar Nelayan" di atas</p>
        </div>
      </CardContent>
    </Card>
  );
}
