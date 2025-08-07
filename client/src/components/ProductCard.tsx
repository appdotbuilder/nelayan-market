
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FishProduct } from '../../../server/src/schema';

interface ProductCardProps {
  product: FishProduct;
  onOrder: (product: FishProduct) => void;
}

export function ProductCard({ product, onOrder }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Habis', color: 'destructive' as const };
    if (stock <= 3) return { text: 'Stok Terbatas', color: 'secondary' as const };
    return { text: 'Tersedia', color: 'default' as const };
  };

  const stockStatus = getStockStatus(product.stock_kg);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-3">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-6xl">🐟</span>
          )}
        </div>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>
          {product.description || 'Ikan segar hasil tangkapan terbaik'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(product.price_per_kg)}
            </p>
            <p className="text-sm text-gray-500">per kg</p>
          </div>
          <Badge variant={stockStatus.color}>
            {stockStatus.text}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Stok: {product.stock_kg} kg</span>
          <span>🎣 Nelayan #{product.fisherman_id}</span>
        </div>
        
        <Button 
          className="w-full" 
          onClick={() => onOrder(product)}
          disabled={product.stock_kg === 0}
        >
          {product.stock_kg === 0 ? 'Stok Habis' : '🛒 Beli Sekarang'}
        </Button>
      </CardContent>
    </Card>
  );
}
