
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { FishermanDashboard } from '@/components/FishermanDashboard';
import { ProductCard } from '@/components/ProductCard';
import { OrderForm } from '@/components/OrderForm';
import { trpc } from '@/utils/trpc';
import type { User, FishProduct, GetFishProductsInput } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'register' | 'dashboard' | 'order'>('home');
  const [selectedProduct, setSelectedProduct] = useState<FishProduct | null>(null);
  const [products, setProducts] = useState<FishProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: GetFishProductsInput = {};
      
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      if (priceFilter !== 'all') {
        switch (priceFilter) {
          case 'low':
            filters.max_price = 50000;
            break;
          case 'medium':
            filters.min_price = 50000;
            filters.max_price = 100000;
            break;
          case 'high':
            filters.min_price = 100000;
            break;
        }
      }

      filters.is_active = true;
      
      const result = await trpc.getFishProducts.query(filters);
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
      // For demo purposes, using placeholder data since backend handlers are not implemented
      setProducts([
        {
          id: 1,
          fisherman_id: 1,
          name: 'Ikan Kakap Merah',
          description: 'Ikan kakap merah segar hasil tangkapan hari ini',
          price_per_kg: 75000,
          stock_kg: 15,
          image_url: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          fisherman_id: 2,
          name: 'Ikan Baronang',
          description: 'Ikan baronang segar dari laut Sulawesi',
          price_per_kg: 45000,
          stock_kg: 8,
          image_url: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          fisherman_id: 1,
          name: 'Cumi-cumi Segar',
          description: 'Cumi-cumi segar baru ditangkap',
          price_per_kg: 85000,
          stock_kg: 5,
          image_url: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, priceFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    if (user.role === 'fisherman') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
  };

  const handleOrderProduct = (product: FishProduct) => {
    setSelectedProduct(product);
    setCurrentView('order');
  };

  const handleOrderComplete = () => {
    setCurrentView('home');
    setSelectedProduct(null);
    loadProducts(); // Refresh products to update stock
  };

  const filteredProducts = products.filter((product: FishProduct) => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Header Component
  const Header = () => (
    <div className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🐟</span>
          <h1 className="text-2xl font-bold">FreshCatch Marketplace</h1>
        </div>
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-blue-500">
                  {currentUser.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{currentUser.full_name}</span>
              <Badge variant={currentUser.role === 'fisherman' ? 'secondary' : 'outline'}>
                {currentUser.role === 'fisherman' ? '🎣 Nelayan' : '🛒 Pembeli'}
              </Badge>
              {currentUser.role === 'fisherman' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-blue-600 bg-white hover:bg-blue-50"
                >
                  Dashboard
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-blue-600 bg-white hover:bg-blue-50"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('login')}
                className="text-blue-600 bg-white hover:bg-blue-50"
              >
                Login Nelayan
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentView('register')}
              >
                Daftar Nelayan
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <Header />
        <div className="container mx-auto p-4 max-w-md">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('home')}
            className="mb-4"
          >
            ← Kembali ke Beranda
          </Button>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <Header />
        <div className="container mx-auto p-4 max-w-md">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('home')}
            className="mb-4"
          >
            ← Kembali ke Beranda
          </Button>
          <RegisterForm onRegister={() => setCurrentView('login')} />
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard' && currentUser?.role === 'fisherman') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <Header />
        <div className="container mx-auto p-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('home')}
            className="mb-4"
          >
            ← Kembali ke Beranda
          </Button>
          <FishermanDashboard user={currentUser} />
        </div>
      </div>
    );
  }

  if (currentView === 'order' && selectedProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <Header />
        <div className="container mx-auto p-4 max-w-2xl">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('home')}
            className="mb-4"
          >
            ← Kembali ke Beranda
          </Button>
          <OrderForm 
            product={selectedProduct} 
            onOrderComplete={handleOrderComplete}
          />
        </div>
      </div>
    );
  }

  // Home Page (Main Marketplace)
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Header />
      
      <div className="container mx-auto p-4">
        {/* Hero Section */}
        <div className="text-center py-8 mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            🌊 Ikan Segar Langsung dari Nelayan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Dapatkan ikan dan hasil laut segar berkualitas terbaik langsung dari tangan nelayan lokal. 
            Segar, berkualitas, dan harga terjangkau!
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔍 Cari Ikan Segar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari nama ikan..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={priceFilter} onValueChange={(value: string) => setPriceFilter(value as typeof priceFilter)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter Harga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Harga</SelectItem>
                  <SelectItem value="low">&lt; Rp 50.000</SelectItem>
                  <SelectItem value="medium">Rp 50.000 - Rp 100.000</SelectItem>
                  <SelectItem value="high">&gt; Rp 100.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Memuat produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <span className="text-6xl mb-4 block">🐟</span>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Belum Ada Ikan yang Tersedia
              </h3>
              <p className="text-gray-600">
                {searchQuery ? 'Tidak ada ikan yang sesuai dengan pencarian Anda.' : 'Saat ini belum ada nelayan yang menjual ikan.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Ditemukan {filteredProducts.length} produk ikan segar
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: FishProduct) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onOrder={handleOrderProduct}
                />
              ))}
            </div>
          </>
        )}

        {/* Info Section */}
        <div className="mt-12">
          <Separator className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <span className="text-4xl mb-2 block">🎣</span>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Langsung dari Nelayan</h3>
              <p className="text-gray-600">Ikan segar hasil tangkapan langsung dari nelayan lokal</p>
            </div>
            <div>
              <span className="text-4xl mb-2 block">💰</span>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Harga Terjangkau</h3>
              <p className="text-gray-600">Dapatkan harga terbaik tanpa perantara</p>
            </div>
            <div>
              <span className="text-4xl mb-2 block">📱</span>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mudah & Praktis</h3>
              <p className="text-gray-600">Pesan via WhatsApp, bayar saat ambil ikan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
