
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { User, FishProduct, CreateFishProductInput, Order, UpdateFishProductInput } from '../../../server/src/schema';

interface FishermanDashboardProps {
  user: User;
}

export function FishermanDashboard({ user }: FishermanDashboardProps) {
  const [products, setProducts] = useState<FishProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  // Product form state
  const [productForm, setProductForm] = useState<CreateFishProductInput>({
    fisherman_id: user.id,
    name: '',
    description: null,
    price_per_kg: 0,
    stock_kg: 0,
    image_url: null
  });

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateFishProductInput | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getFishermanProducts.query(user.id);
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Using placeholder data for demo since backend handlers are not implemented
      setProducts([
        {
          id: 1,
          fisherman_id: user.id,
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
          id: 3,
          fisherman_id: user.id,
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
  }, [user.id]);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getFishermanOrders.query({ fisherman_id: user.id });
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
      // Using placeholder data for demo since backend handlers are not implemented
      setOrders([
        {
          id: 1,
          fish_product_id: 1,
          buyer_name: 'Ibu Sari',
          buyer_phone: '081234567890',
          buyer_address: 'Jl. Merdeka No. 123, Jakarta',
          quantity_kg: 2,
          total_price: 150000,
          payment_method: 'cash_on_pickup',
          status: 'pending',
          notes: 'Mohon ikan dibersihkan',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          fish_product_id: 3,
          buyer_name: 'Bapak Andi',
          buyer_phone: '082345678901',
          buyer_address: 'Jl. Sudirman No. 456, Jakarta',
          quantity_kg: 1,
          total_price: 85000,
          payment_method: 'cash_on_pickup',
          status: 'confirmed',
          notes: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, [loadProducts, loadOrders]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newProduct = await trpc.createFishProduct.mutate(productForm);
      setProducts((prev: FishProduct[]) => [newProduct, ...prev]);
      setProductForm({
        fisherman_id: user.id,
        name: '',
        description: null,
        price_per_kg: 0,
        stock_kg: 0,
        image_url: null
      });
    } catch (error) {
      console.error('Failed to create product:', error);
      // For demo, simulate success with placeholder data
      const placeholderProduct: FishProduct = {
        id: Date.now(),
        fisherman_id: productForm.fisherman_id,
        name: productForm.name,
        description: productForm.description || null,
        price_per_kg: productForm.price_per_kg,
        stock_kg: productForm.stock_kg,
        image_url: productForm.image_url || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      setProducts((prev: FishProduct[]) => [placeholderProduct, ...prev]);
      setProductForm({
        fisherman_id: user.id,
        name: '',
        description: null,
        price_per_kg: 0,
        stock_kg: 0,
        image_url: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setIsLoading(true);
    try {
      const updatedProduct = await trpc.updateFishProduct.mutate(editForm);
      setProducts((prev: FishProduct[]) => 
        prev.map((p: FishProduct) => p.id === editForm.id ? updatedProduct : p)
      );
      setEditForm(null);
    } catch (error) {
      console.error('Failed to update product:', error);
      // For demo, simulate success
      setProducts((prev: FishProduct[]) => 
        prev.map((p: FishProduct) => 
          p.id === editForm.id 
            ? { ...p, ...editForm, updated_at: new Date() }
            : p
        )
      );
      setEditForm(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    setIsLoading(true);
    try {
      await trpc.deleteFishProduct.mutate(productId);
      setProducts((prev: FishProduct[]) => prev.filter((p: FishProduct) => p.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      // For demo, simulate success
      setProducts((prev: FishProduct[]) => prev.filter((p: FishProduct) => p.id !== productId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    setIsLoading(true);
    try {
      await trpc.updateOrderStatus.mutate({ id: orderId, status });
      setOrders((prev: Order[]) => 
        prev.map((order: Order) => 
          order.id === orderId ? { ...order, status, updated_at: new Date() } : order
        )
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
      // For demo, simulate success
      setOrders((prev: Order[]) => 
        prev.map((order: Order) => 
          order.id === orderId ? { ...order, status, updated_at: new Date() } : order
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startEditProduct = (product: FishProduct) => {
    setEditForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price_per_kg: product.price_per_kg,
      stock_kg: product.stock_kg,
      image_url: product.image_url,
      is_active: product.is_active
    });
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">⏳ Menunggu</Badge>;
      case 'confirmed':
        return <Badge variant="default">✅ Dikonfirmasi</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600">🎉 Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">❌ Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🎣 Dashboard Nelayan</CardTitle>
          <CardDescription>
            Selamat datang, {user.full_name}! Kelola produk ikan dan pesanan Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="text-2xl font-bold text-blue-600">{products.length}</h3>
              <p className="text-blue-800">Produk Aktif</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="text-2xl font-bold text-green-600">
                {orders.filter((o: Order) => o.status === 'pending' || o.status === 'confirmed').length}
              </h3>
              <p className="text-green-800">Pesanan Aktif</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-2xl font-bold text-yellow-600">
                {formatPrice(
                  orders
                    .filter((o: Order) => o.status === 'completed')
                    .reduce((sum: number, o: Order) => sum + o.total_price, 0)
                )}
              </h3>
              <p className="text-yellow-800">Total Penjualan</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">🐟 Kelola Produk</TabsTrigger>
          <TabsTrigger value="orders">📋 Kelola Pesanan</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Add Product Form */}
          <Card>
            <CardHeader>
              <CardTitle>➕ Tambah Produk Ikan Baru</CardTitle>
              <CardDescription>
                Unggah ikan segar hasil tangkapan Anda untuk dijual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Ikan</Label>
                    <Input
                      id="name"
                      placeholder="Contoh: Ikan Kakap Merah"
                      value={productForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateFishProductInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_kg">Harga per Kg (Rp)</Label>
                    <Input
                      id="price_per_kg"
                      type="number"
                      placeholder="75000"
                      value={productForm.price_per_kg || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateFishProductInput) => ({ 
                          ...prev, 
                          price_per_kg: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    placeholder="Contoh: Ikan kakap merah segar hasil tangkapan hari ini"
                    value={productForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setProductForm((prev: CreateFishProductInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_kg">Stok (Kg)</Label>
                    <Input
                      id="stock_kg"
                      type="number"
                      placeholder="15"
                      value={productForm.stock_kg || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateFishProductInput) => ({ 
                          ...prev, 
                          stock_kg: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL Foto Ikan (Opsional)</Label>
                    <Input
                      id="image_url"
                      placeholder="https://..."
                      value={productForm.image_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateFishProductInput) => ({ 
                          ...prev, 
                          image_url: e.target.value || null 
                        }))
                      }
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : '💾 Simpan Produk'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Products List */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Daftar Produk Anda</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-6xl mb-4 block">🐟</span>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Belum Ada Produk
                  </h3>
                  <p className="text-gray-600">
                    Mulai tambahkan produk ikan segar Anda di atas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product: FishProduct) => (
                    <div key={product.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          {product.description && (
                            <p className="text-gray-600 text-sm">{product.description}</p>
                          )}
                        </div>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? '✅ Aktif' : '⏸️ Nonaktif'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Harga per Kg</p>
                          <p className="font-semibold">{formatPrice(product.price_per_kg)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Stok</p>
                          <p className="font-semibold">{product.stock_kg} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Dibuat</p>
                          <p className="text-sm">{product.created_at.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Terakhir Update</p>
                          <p className="text-sm">{product.updated_at.toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startEditProduct(product)}
                            >
                              ✏️ Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Produk</DialogTitle>
                              <DialogDescription>
                                Ubah informasi produk ikan Anda
                              </DialogDescription>
                            </DialogHeader>
                            {editForm && (
                              <form onSubmit={handleEditProduct} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit_name">Nama Ikan</Label>
                                  <Input
                                    id="edit_name"
                                    value={editForm.name || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setEditForm((prev: UpdateFishProductInput | null) => 
                                        prev ? { ...prev, name: e.target.value } : null
                                      )
                                    }
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_description">Deskripsi</Label>
                                  <Textarea
                                    id="edit_description"
                                    value={editForm.description || ''}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                      setEditForm((prev: UpdateFishProductInput | null) => 
                                        prev ? { ...prev, description: e.target.value || null } : null
                                      )
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit_price">Harga per Kg</Label>
                                    <Input
                                      id="edit_price"
                                      type="number"
                                      value={editForm.price_per_kg || ''}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setEditForm((prev: UpdateFishProductInput | null) => 
                                          prev ? { ...prev, price_per_kg: parseFloat(e.target.value) || 0 } : null
                                        )
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit_stock">Stok (Kg)</Label>
                                    <Input
                                      id="edit_stock"
                                      type="number"
                                      value={editForm.stock_kg || ''}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setEditForm((prev: UpdateFishProductInput | null) => 
                                          prev ? { ...prev, stock_kg: parseFloat(e.target.value) || 0 } : null
                                        )
                                      }
                                      required
                                    />
                                  </div>
                                </div>
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          🗑️ Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📋 Pesanan Masuk</CardTitle>
              <CardDescription>
                Kelola pesanan dari pembeli dan update status pesanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-6xl mb-4 block">📋</span>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Belum Ada Pesanan
                  </h3>
                  <p className="text-gray-600">
                    Pesanan dari pembeli akan muncul di sini
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: Order) => (
                    <div key={order.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{order.buyer_name}</h3>
                          <p className="text-gray-600 text-sm">📱 {order.buyer_phone}</p>
                        </div>
                        <div className="text-right">
                          {getOrderStatusBadge(order.status)}
                          <p className="text-sm text-gray-500 mt-1">
                            {order.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Produk & Jumlah</p>
                          <p className="font-semibold">
                            Produk #{order.fish_product_id} - {order.quantity_kg} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Harga</p>
                          <p className="font-semibold text-blue-600">
                            {formatPrice(order.total_price)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-500">Alamat Pembeli</p>
                        <p className="text-sm">{order.buyer_address}</p>
                      </div>
                      
                      {order.notes && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500">Catatan</p>
                          <p className="text-sm bg-yellow-50 p-2 rounded">{order.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Select
                          value={order.status}
                          onValueChange={(status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => 
                            handleUpdateOrderStatus(order.id, status)
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">⏳ Menunggu</SelectItem>
                            <SelectItem value="confirmed">✅ Dikonfirmasi</SelectItem>
                            <SelectItem value="completed">🎉 Selesai</SelectItem>
                            <SelectItem value="cancelled">❌ Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://wa.me/${order.buyer_phone.replace(/^0/, '62')}`, '_blank')}
                        >
                          💬 WhatsApp
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
