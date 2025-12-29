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
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Package, Edit, Eye, EyeOff, Mail, MapPin } from "lucide-react";
import logo from "@assets/Transparent_Cobbler's_Bench_Logo_1767042558581.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Order, OrderItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/ImageUploader";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
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

  const { data: orders = [], isLoading: ordersLoading } = useQuery<(Order & { items: OrderItem[] })[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'orders',
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'products',
  });

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
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder({ ...selectedOrder, status: updatedOrder.status });
      }
      toast({ title: "Status updated successfully" });
    },
  });

  const updateTrackingMutation = useMutation({
    mutationFn: async ({ id, trackingNumber }: { id: number; trackingNumber: string }) => {
      const response = await fetch(`/api/orders/${id}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNumber || "" }),
      });
      if (!response.ok) throw new Error('Failed to update tracking');
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setEditingTracking(null);
      setTrackingNumber("");
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder({ ...selectedOrder, trackingNumber: updatedOrder.trackingNumber });
      }
      toast({ title: "Tracking number updated successfully" });
    },
  });

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
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                data-testid="input-admin-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
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
                    <TableRow key={order.id} data-testid={`order-row-${order.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOrder(order)}>
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
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
                              onClick={(e) => {
                                e.stopPropagation();
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                        </div>
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
                  <ProductForm onSuccess={() => setIsAddProductOpen(false)} />
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
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingProduct(product)}
                              data-testid={`button-edit-product-${product.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
                          </div>
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

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Order #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge variant={
                  selectedOrder.status === 'Paid' ? 'secondary' : 
                  selectedOrder.status === 'Shipped' ? 'default' : 'outline'
                } className="text-base px-3 py-1" data-testid="order-detail-status">
                  {selectedOrder.status}
                </Badge>
                <span className="text-muted-foreground">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              <Separator />

              {/* Customer Contact Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Customer Information
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="font-medium min-w-24">Name:</span>
                    <span data-testid="order-detail-customer-name">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-medium min-w-24">Email:</span>
                    <a 
                      href={`mailto:${selectedOrder.customerEmail}`} 
                      className="text-primary hover:underline"
                      data-testid="order-detail-customer-email"
                    >
                      {selectedOrder.customerEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Shipping Address
                </h3>
                <div className="bg-muted/30 rounded-lg p-4" data-testid="order-detail-address">
                  <p>{selectedOrder.shippingAddress}</p>
                  <p>{selectedOrder.shippingCity}, {selectedOrder.shippingZip}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" /> Order Items
                </h3>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id} data-testid={`order-detail-item-${item.id}`}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.productPrice}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${(parseFloat(item.productPrice.toString()) * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold text-lg" data-testid="order-detail-total">
                          ${selectedOrder.total}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tracking Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Tracking Number</h3>
                <div className="flex gap-2">
                  <Input 
                    value={selectedOrder.trackingNumber || ""}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })}
                    placeholder="Enter tracking number (or leave empty to clear)"
                    data-testid="order-detail-tracking-input"
                  />
                  <Button 
                    onClick={() => {
                      updateTrackingMutation.mutate({ 
                        id: selectedOrder.id, 
                        trackingNumber: selectedOrder.trackingNumber || "" 
                      });
                    }}
                    disabled={updateTrackingMutation.isPending}
                    data-testid="order-detail-save-tracking"
                  >
                    {updateTrackingMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Update Status</h3>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({ id: selectedOrder.id, status: value });
                    setSelectedOrder({ ...selectedOrder, status: value });
                  }}
                >
                  <SelectTrigger data-testid="order-detail-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm 
              product={editingProduct} 
              onSuccess={() => setEditingProduct(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ product, onSuccess }: { product?: Product; onSuccess: () => void }) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [category, setCategory] = useState(product?.category || "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProductMutation = useMutation({
    mutationFn: async (productData: { name: string; description: string; price: string; category: string; imageUrl: string }) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product created successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: { id: number; name: string; description: string; price: string; category: string; imageUrl: string }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product updated successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "Please enter a product name", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Please enter a description", variant: "destructive" });
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast({ title: "Please enter a valid price", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    if (!imageUrl) {
      toast({ title: "Please upload an image first", variant: "destructive" });
      return;
    }
    
    const productData = { 
      name: name.trim(), 
      description: description.trim(), 
      price, 
      category, 
      imageUrl 
    };
    
    if (product) {
      updateProductMutation.mutate({ id: product.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input 
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Boot Resole Service"
          data-testid="input-product-name"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your product or service..."
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
          min="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          data-testid="input-product-price"
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
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
        <div className="mt-2">
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            disabled={isPending}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isPending}
        data-testid="button-save-product"
      >
        {isPending 
          ? "Saving..." 
          : product ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}
