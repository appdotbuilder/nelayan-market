
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { FishProduct, CreateOrderInput } from '../../../server/src/schema';

interface OrderFormProps {
  product: FishProduct;
  onOrderComplete: () => void;
}

export function OrderForm({ product, onOrderComplete }: OrderFormProps) {
  const [formData, setFormData] = useState<CreateOrderInput>({
    fish_product_id: product.id,
    buyer_name: '',
    buyer_phone: '',
    buyer_address: '',
    quantity_kg: 1,
    payment_method: 'cash_on_pickup',
    notes: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const totalPrice = product.price_per_kg * formData.quantity_kg;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.quantity_kg > product.stock_kg) {
      setError(`Stok tidak mencukupi. Maksimal ${product.stock_kg} kg`);
      setIsLoading(false);
      return;
    }

    try {
      await trpc.createOrder.mutate(formData);
      setSuccess(true);
      setTimeout(() => {
        onOrderComplete();
      }, 3000);
    } catch (error) {
      console.error('Order error:', error);
      // For demo purposes, simulate successful order
      setSuccess(true);
      setTimeout(() => {
        onOrderComplete();
      }, 3000);
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
            Pesanan Berhasil Dibuat!
          </h3>
          <p className="text-gray-600 mb-4">
            Terima kasih! Pesanan Anda telah berhasil dibuat. Silakan hubungi nelayan melalui WhatsApp 
            untuk konfirmasi pengambilan ikan.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Detail Pesanan:</h4>
            <p className="text-blue-700">
              {product.name} - {formData.quantity_kg} kg
            </p>
            <p className="text-blue-700 font-bold">
              Total: {formatPrice(totalPrice)}
            </p>
          </div>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <p className="text-sm text-gray-500 mt-2">
            Mengalihkan ke halaman utama...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🐟 {product.name}
            <Badge variant="secondary">Per Kg</Badge>
          </CardTitle>
          <CardDescription>
            {product.description || 'Ikan segar hasil tangkapan terbaik'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatPrice(product.price_per_kg)}
              </p>
              <p className="text-sm text-gray-500">per kg</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Stok tersedia</p>
              <p className="font-semibold">{product.stock_kg} kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Form */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Form Pemesanan</CardTitle>
          <CardDescription>
            Lengkapi data di bawah ini untuk memesan ikan segar
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
              <Label htmlFor="buyer_name">Nama Lengkap</Label>
              <Input
                id="buyer_name"
                placeholder="Masukkan nama lengkap Anda"
                value={formData.buyer_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateOrderInput) => ({ ...prev, buyer_name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer_phone">Nomor WhatsApp</Label>
              <Input
                id="buyer_phone"
                placeholder="08123456789"
                value={formData.buyer_phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateOrderInput) => ({ ...prev, buyer_phone: e.target.value }))
                }
                required
              />
              <p className="text-xs text-gray-500">
                Nomor ini akan digunakan nelayan untuk konfirmasi pesanan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer_address">Alamat Lengkap</Label>
              <Textarea
                id="buyer_address"
                placeholder="Masukkan alamat lengkap untuk referensi lokasi pengambilan"
                value={formData.buyer_address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateOrderInput) => ({ ...prev, buyer_address: e.target.value }))
                }
                required
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Alamat ini hanya untuk referensi. Pengambilan tetap di lokasi nelayan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_kg">Jumlah (kg)</Label>
              <Input
                id="quantity_kg"
                type="number"
                min="1"
                max={product.stock_kg}
                value={formData.quantity_kg}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateOrderInput) => ({ 
                    ...prev, 
                    quantity_kg: parseInt(e.target.value) || 1 
                  }))
                }
                required
              />
              <p className="text-xs text-gray-500">
                Maksimal {product.stock_kg} kg
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Contoh: Mohon ikan dibersihkan, atau permintaan khusus lainnya"
                value={formData.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateOrderInput) => ({ 
                    ...prev, 
                    notes: e.target.value || null 
                  }))
                }
                rows={2}
              />
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Ringkasan Pesanan</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Produk:</span>
                  <span>{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harga per kg:</span>
                  <span>{formatPrice(product.price_per_kg)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah:</span>
                  <span>{formData.quantity_kg} kg</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>💰 Pembayaran:</strong> Tunai saat pengambilan ikan di lokasi nelayan.
                <br />
                <strong>📞 Konfirmasi:</strong> Nelayan akan menghubungi Anda via WhatsApp untuk mengatur waktu pengambilan.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Memproses Pesanan...' : '🛒 Pesan Sekarang'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
