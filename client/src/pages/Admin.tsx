import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Package, Edit } from "lucide-react";
import logo from "@assets/Transparent_Cobbler's_Bench_Logo_1767042558581.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Order, OrderItem } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingTracking, setEditingTracking] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password (hint: admin123)");
    }
  };

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<(Order & { items: OrderItem[] })[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'orders',
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'products',
  });

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Status updated successfully" });
    },
  });

  // Update tracking number
  const updateTrackingMutation = useMutation({
    mutationFn: async ({ id, trackingNumber }: { id: number; trackingNumber: string }) => {
      const response = await fetch(`/api/orders/${id}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber }),
      });
      if (!response.ok) throw new Error('Failed to update tracking');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setEditingTracking(null);
      setTrackingNumber("");
      toast({ title: "Tracking number updated successfully" });
    },
  });

  // Delete product
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product deleted successfully" });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="w-full max-w-md p-8 bg-card rounded-xl border shadow-sm text-center">
          <div className="mx-auto h-16 w-16 mb-4">
             <img src={logo} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-admin-password"
            />
            <Button type="submit" className="w-full" data-testid="button-admin-login">Access Dashboard</Button>
          </form>
          <div className="mt-4">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
           <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
           <span className="font-bold font-serif">Admin Panel</span>
        </div>
        
        <nav className="space-y-2">
          <Button 
            variant={activeTab === 'orders' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('orders')}
            data-testid="tab-orders"
          >
            <Package className="mr-2 h-4 w-4" /> Orders
          </Button>
          <Button 
            variant={activeTab === 'products' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('products')}
            data-testid="tab-products"
          >
            <Plus className="mr-2 h-4 w-4" /> Products
          </Button>
        </nav>

        <div className="mt-auto pt-8">
           <Link href="/" className="text-sm text-muted-foreground hover:underline">
             Back to Store
           </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-bold font-serif">{activeTab === 'orders' ? 'Order Management' : 'Product Management'}</h1>
           <div className="md:hidden">
              <Link href="/" className="text-sm text-primary">
                Back to Store
              </Link>
           </div>
        </div>

        {activeTab === 'orders' ? (
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            {ordersLoading ? (
              <div className="p-8 text-center text-muted-foreground" data-testid="loading-orders">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground" data-testid="no-orders">
                No orders yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell data-testid={`order-total-${order.id}`}>${order.total}</TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'Paid' ? 'secondary' : 
                          order.status === 'Shipped' ? 'default' : 'outline'
                        } data-testid={`order-status-${order.id}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingTracking === order.id ? (
                          <div className="flex gap-2">
                            <Input 
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="Tracking #"
                              className="w-32"
                              data-testid={`input-tracking-${order.id}`}
                            />
                            <Button 
                              size="sm"
                              onClick={() => updateTrackingMutation.mutate({ id: order.id, trackingNumber })}
                              data-testid={`button-save-tracking-${order.id}`}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm" data-testid={`tracking-number-${order.id}`}>
                              {order.trackingNumber || 'None'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTracking(order.id);
                                setTrackingNumber(order.trackingNumber || "");
                              }}
                              data-testid={`button-edit-tracking-${order.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <select 
                          className="text-sm border rounded p-1"
                          value={order.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}
                          data-testid={`select-status-${order.id}`}
                        >
                          <option>Pending Payment</option>
                          <option>Paid</option>
                          <option>Shipped</option>
                          <option>Cancelled</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-product">
                    <Plus className="mr-2 h-4 w-4" /> Add New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <AddProductForm onSuccess={() => setIsAddProductOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              {productsLoading ? (
                <div className="p-8 text-center text-muted-foreground" data-testid="loading-products">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground" data-testid="no-products-admin">
                  No products yet. Add your first product to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                        <TableCell>
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="h-10 w-10 rounded object-cover bg-muted" 
                            data-testid={`product-image-${product.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`product-name-${product.id}`}>{product.name}</TableCell>
                        <TableCell data-testid={`product-category-${product.id}`}>{product.category}</TableCell>
                        <TableCell data-testid={`product-price-${product.id}`}>${product.price}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Delete ${product.name}?`)) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setImageUrl(response.objectPath);
      toast({ title: "Image uploaded successfully" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (product: { name: string; description: string; price: string; category: string; imageUrl: string }) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product created successfully" });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast({ title: "Please upload an image", variant: "destructive" });
      return;
    }
    createProductMutation.mutate({ name, description, price, category, imageUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input 
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="input-product-name"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          data-testid="input-product-description"
        />
      </div>

      <div>
        <Label htmlFor="price">Price ($)</Label>
        <Input 
          id="price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          data-testid="input-product-price"
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger data-testid="select-product-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="care">Shoe Care</SelectItem>
            <SelectItem value="goods">Leather Goods</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Product Image</Label>
        <div className="flex gap-2 items-center">
          <Input 
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
            disabled={isUploading}
            data-testid="input-product-image"
          />
          {imageUrl && <span className="text-sm text-green-600">✓ Uploaded</span>}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={createProductMutation.isPending || isUploading}
        data-testid="button-create-product"
      >
        {createProductMutation.isPending ? "Creating..." : "Create Product"}
      </Button>
    </form>
  );
}
