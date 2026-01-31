import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Package, Edit, Eye, EyeOff, Mail, MapPin, Archive, AlertCircle, CheckCircle, DollarSign, Truck, FileText, ArchiveRestore, Phone, Filter, MessageSquare, Clock, Star, User, Search, LayoutGrid, List, ImageOff, FileEdit } from "lucide-react";
import logo from "@assets/Transparent_Cobbler's_Bench_Logo_1767042558581.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Order, OrderItem, ServiceInquiry, Review, SiteContent } from "@shared/schema";
import { PRODUCT_TYPES, BRANDS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/ImageUploader";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'inquiries' | 'reviews' | 'content'>('orders');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [editingTracking, setEditingTracking] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderFilter, setOrderFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<ServiceInquiry | null>(null);
  const [editingInquiryNotes, setEditingInquiryNotes] = useState<number | null>(null);
  const [inquiryNotesText, setInquiryNotesText] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("all");
  const [productBrandFilter, setProductBrandFilter] = useState<string>("all");
  const [productViewMode, setProductViewMode] = useState<'grid' | 'table'>('grid');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        alert("Invalid password");
      }
    } catch (error) {
      alert("Authentication failed");
    }
  };

  const { data: orders = [], isLoading: ordersLoading } = useQuery<(Order & { items: OrderItem[] })[]>({
    queryKey: ['/api/orders', orderFilter],
    queryFn: async () => {
      const includeArchived = orderFilter === 'archived' || orderFilter === 'all';
      const response = await fetch(`/api/orders?includeArchived=${includeArchived}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const allOrders = await response.json();
      if (orderFilter === 'archived') {
        return allOrders.filter((o: Order) => o.archived);
      }
      return allOrders;
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

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<ServiceInquiry[]>({
    queryKey: ['/api/service-inquiries'],
    queryFn: async () => {
      const response = await fetch('/api/service-inquiries');
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'inquiries',
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
    queryFn: async () => {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'reviews',
  });

  const updateInquiryStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/service-inquiries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: (updatedInquiry) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-inquiries'] });
      if (selectedInquiry && selectedInquiry.id === updatedInquiry.id) {
        setSelectedInquiry(updatedInquiry);
      }
      toast({ title: "Status updated" });
    },
  });

  const updateInquiryNotesMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: number; adminNotes: string }) => {
      const response = await fetch(`/api/service-inquiries/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to update notes');
      return response.json();
    },
    onSuccess: (updatedInquiry) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-inquiries'] });
      setEditingInquiryNotes(null);
      setInquiryNotesText("");
      if (selectedInquiry && selectedInquiry.id === updatedInquiry.id) {
        setSelectedInquiry(updatedInquiry);
      }
      toast({ title: "Notes saved" });
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/service-inquiries/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete inquiry');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-inquiries'] });
      setSelectedInquiry(null);
      toast({ title: "Inquiry deleted" });
    },
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
      queryClient.invalidateQueries({ queryKey: ['/api/orders'], exact: false });
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
      queryClient.invalidateQueries({ queryKey: ['/api/orders'], exact: false });
      setEditingTracking(null);
      setTrackingNumber("");
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder({ ...selectedOrder, trackingNumber: updatedOrder.trackingNumber });
      }
      toast({ title: "Tracking number updated successfully" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete order');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'], exact: false });
      setSelectedOrder(null);
      toast({ title: "Order deleted successfully" });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: number; paymentStatus: string }) => {
      const response = await fetch(`/api/orders/${id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update payment status');
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'], exact: false });
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder({ ...selectedOrder, ...updatedOrder });
      }
      toast({ title: `Marked as ${updatedOrder.paymentStatus}` });
    },
  });

  const updateFulfillmentStatusMutation = useMutation({
    mutationFn: async ({ id, fulfillmentStatus }: { id: number; fulfillmentStatus: string }) => {
      const response = await fetch(`/api/orders/${id}/fulfillment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillmentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update fulfillment status');
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'], exact: false });
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder({ ...selectedOrder, ...updatedOrder });
      }
      toast({ title: "Fulfillment status updated" });
    },
  });

  const archiveOrderMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: number; archived: boolean }) => {
      const response = await fetch(`/api/orders/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });
      if (!response.ok) throw new Error('Failed to archive order');
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'], exact: false });
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder({ ...selectedOrder, ...updatedOrder });
      }
      toast({ title: updatedOrder.archived ? "Order archived" : "Order restored" });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: number; adminNotes: string }) => {
      const response = await fetch(`/api/orders/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to update notes');
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'], exact: false });
      setEditingNotes(null);
      setNotesText("");
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder({ ...selectedOrder, ...updatedOrder });
      }
      toast({ title: "Notes saved" });
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
          <Button 
            variant={activeTab === 'inquiries' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('inquiries')}
            data-testid="tab-inquiries"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Service Inquiries
            {inquiries.filter(i => i.status === 'new').length > 0 && (
              <Badge variant="destructive" className="ml-auto">{inquiries.filter(i => i.status === 'new').length}</Badge>
            )}
          </Button>
          <Button 
            variant={activeTab === 'reviews' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('reviews')}
            data-testid="tab-reviews"
          >
            <Star className="mr-2 h-4 w-4" /> Reviews
          </Button>
          <Button 
            variant={activeTab === 'content' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('content')}
            data-testid="tab-content"
          >
            <FileEdit className="mr-2 h-4 w-4" /> Site Content
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
           <h1 className="text-3xl font-bold font-serif">{activeTab === 'orders' ? 'Order Management' : activeTab === 'products' ? 'Product Management' : activeTab === 'inquiries' ? 'Service Inquiries' : activeTab === 'reviews' ? 'Reviews' : 'Site Content'}</h1>
           <div className="md:hidden">
              <Link href="/" className="text-sm text-primary">
                Back to Store
              </Link>
           </div>
        </div>

        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {/* Order Filters */}
            <div className="flex items-center gap-4 bg-card rounded-lg border p-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
              <div className="flex gap-2">
                <Button
                  variant={orderFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderFilter('active')}
                  data-testid="filter-active-orders"
                >
                  Active
                </Button>
                <Button
                  variant={orderFilter === 'archived' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderFilter('archived')}
                  data-testid="filter-archived-orders"
                >
                  Archived
                </Button>
                <Button
                  variant={orderFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderFilter('all')}
                  data-testid="filter-all-orders"
                >
                  All
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              {ordersLoading ? (
                <div className="p-8 text-center text-muted-foreground" data-testid="loading-orders">
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground" data-testid="no-orders">
                  {orderFilter === 'archived' ? 'No archived orders' : orderFilter === 'all' ? 'No orders yet' : 'No active orders'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Fulfillment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow 
                        key={order.id} 
                        data-testid={`order-row-${order.id}`} 
                        className={`cursor-pointer hover:bg-muted/50 ${order.archived ? 'opacity-60' : ''}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            #{order.id}
                            {order.archived && (
                              <Badge variant="outline" className="text-xs">
                                <Archive className="h-3 w-3 mr-1" />
                                Archived
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell data-testid={`order-total-${order.id}`} className="font-medium">${order.total}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Badge 
                            variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                            className={`cursor-pointer ${order.paymentStatus === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}
                            onClick={() => updatePaymentStatusMutation.mutate({ 
                              id: order.id, 
                              paymentStatus: order.paymentStatus === 'paid' ? 'unpaid' : 'paid' 
                            })}
                            data-testid={`order-payment-${order.id}`}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select 
                            value={order.fulfillmentStatus || 'unfulfilled'} 
                            onValueChange={(value) => updateFulfillmentStatusMutation.mutate({ id: order.id, fulfillmentStatus: value })}
                          >
                            <SelectTrigger className="w-32 h-8" data-testid={`order-fulfillment-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unfulfilled">
                                <div className="flex items-center gap-2">
                                  <Package className="h-3 w-3 text-yellow-500" />
                                  Unfulfilled
                                </div>
                              </SelectItem>
                              <SelectItem value="shipped">
                                <div className="flex items-center gap-2">
                                  <Truck className="h-3 w-3 text-blue-500" />
                                  Shipped
                                </div>
                              </SelectItem>
                              <SelectItem value="delivered">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  Delivered
                                </div>
                              </SelectItem>
                              <SelectItem value="fulfilled">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  Fulfilled
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedOrder(order)}
                              data-testid={`button-view-order-${order.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => archiveOrderMutation.mutate({ id: order.id, archived: !order.archived })}
                              data-testid={`button-archive-order-${order.id}`}
                            >
                              {order.archived ? (
                                <ArchiveRestore className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm('Are you sure you want to permanently delete this order?')) {
                                  deleteOrderMutation.mutate(order.id);
                                }
                              }}
                              data-testid={`button-delete-order-${order.id}`}
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
        ) : activeTab === 'products' ? (
          <div className="space-y-6">
            {productsLoading ? (
              <div className="p-8 text-center text-muted-foreground" data-testid="loading-products">
                Loading products...
              </div>
            ) : (() => {
              const categories = Array.from(new Set(products.map(p => p.category).filter(c => c && c.trim()))).sort();
              const brands = Array.from(new Set(products.map(p => p.brand).filter((b): b is string => !!b && b.trim() !== ''))).sort();
              const categoryCounts = products.reduce((acc, p) => {
                const cat = p.category || 'Uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              const statusCounts = products.reduce((acc, p) => {
                acc[p.status] = (acc[p.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              const brandCounts = products.reduce((acc, p) => {
                const brand = p.brand || 'No Brand';
                acc[brand] = (acc[brand] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              const filteredProducts = products.filter(p => {
                const searchTerm = productSearch.toLowerCase();
                const matchesSearch = productSearch === "" || 
                  (p.name || '').toLowerCase().includes(searchTerm) ||
                  (p.sku || '').toLowerCase().includes(searchTerm) ||
                  (p.tags || '').toLowerCase().includes(searchTerm);
                const matchesCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
                const matchesStatus = productStatusFilter === "all" || p.status === productStatusFilter;
                const matchesBrand = productBrandFilter === "all" || p.brand === productBrandFilter || (productBrandFilter === "none" && !p.brand);
                return matchesSearch && matchesCategory && matchesStatus && matchesBrand;
              });
              
              return (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products by name, SKU, or tags..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-9"
                        data-testid="input-product-search"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex border rounded-md">
                        <Button
                          variant={productViewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="rounded-r-none"
                          onClick={() => setProductViewMode('grid')}
                          data-testid="button-view-grid"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={productViewMode === 'table' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="rounded-l-none"
                          onClick={() => setProductViewMode('table')}
                          data-testid="button-view-table"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                        <DialogTrigger asChild>
                          <Button data-testid="button-add-product">
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                          </DialogHeader>
                          <ProductForm onSuccess={() => setIsAddProductOpen(false)} existingCategories={categories} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={productCategoryFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProductCategoryFilter("all")}
                      data-testid="filter-category-all"
                    >
                      All Categories
                      <Badge variant="secondary" className="ml-2 bg-background/20">{products.length}</Badge>
                    </Button>
                    {categories.map(cat => (
                      <Button
                        key={cat}
                        variant={productCategoryFilter === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProductCategoryFilter(cat)}
                        data-testid={`filter-category-${cat}`}
                      >
                        {cat}
                        <Badge variant="secondary" className="ml-2 bg-background/20">{categoryCounts[cat] || 0}</Badge>
                      </Button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Select value={productStatusFilter} onValueChange={setProductStatusFilter}>
                        <SelectTrigger className="w-40" data-testid="filter-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status ({products.length})</SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Active ({statusCounts['active'] || 0})
                            </div>
                          </SelectItem>
                          <SelectItem value="draft">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-yellow-500" />
                              Draft ({statusCounts['draft'] || 0})
                            </div>
                          </SelectItem>
                          <SelectItem value="archived">
                            <div className="flex items-center gap-2">
                              <Archive className="h-3 w-3 text-gray-500" />
                              Archived ({statusCounts['archived'] || 0})
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground">Brand:</span>
                      <Select value={productBrandFilter} onValueChange={setProductBrandFilter}>
                        <SelectTrigger className="w-44" data-testid="filter-brand">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Brands ({products.length})</SelectItem>
                          <SelectItem value="none">No Brand ({brandCounts['No Brand'] || 0})</SelectItem>
                          {brands.map(brand => (
                            <SelectItem key={brand} value={brand}>
                              {brand} ({brandCounts[brand] || 0})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(productSearch || productCategoryFilter !== "all" || productStatusFilter !== "all" || productBrandFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProductSearch("");
                          setProductCategoryFilter("all");
                          setProductStatusFilter("all");
                          setProductBrandFilter("all");
                        }}
                        className="text-muted-foreground"
                        data-testid="button-clear-filters"
                      >
                        Clear filters
                      </Button>
                    )}
                    <span className="text-sm text-muted-foreground ml-auto">
                      Showing {filteredProducts.length} of {products.length} products
                    </span>
                  </div>
            
                  {products.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border" data-testid="no-products-admin">
                      No products yet. Add your first product to get started.
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border" data-testid="no-matching-products">
                      No products match your filters.
                    </div>
                  ) : productViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden group" data-testid={`product-card-${product.id}`}>
                          <div className="aspect-square relative bg-muted">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                                data-testid={`product-image-${product.id}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageOff className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2 flex gap-1">
                              <Badge 
                                variant={product.status === 'active' ? 'default' : product.status === 'draft' ? 'secondary' : 'outline'}
                                className={`${product.status === 'archived' ? 'opacity-70' : ''} text-xs`}
                                data-testid={`product-status-${product.id}`}
                              >
                                {product.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {product.status === 'archived' && <Archive className="h-3 w-3 mr-1" />}
                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Button 
                                variant="secondary" 
                                size="icon"
                                className="h-8 w-8 shadow-sm"
                                onClick={() => setEditingProduct(product)}
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive shadow-sm"
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
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium truncate" data-testid={`product-name-${product.id}`}>{product.name}</h3>
                                <p className="text-xs text-muted-foreground">{product.category}</p>
                                {product.sku && (
                                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-primary" data-testid={`product-price-${product.id}`}>${product.price}</p>
                                {product.compareAtPrice && (
                                  <p className="text-xs text-muted-foreground line-through">${product.compareAtPrice}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t" data-testid={`product-inventory-${product.id}`}>
                              {product.trackInventory ? (
                                <span className={`text-sm ${product.inventory !== null && product.inventory <= 5 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                  {product.inventory !== null && product.inventory <= 5 && (
                                    <AlertCircle className="h-3 w-3 inline mr-1" />
                                  )}
                                  {product.inventory ?? 0} in stock
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Inventory not tracked</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Inventory</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => (
                            <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                              <TableCell>
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="h-10 w-10 rounded object-cover bg-muted" 
                                  data-testid={`product-image-${product.id}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium" data-testid={`product-name-${product.id}`}>
                                {product.name}
                                {product.sku && (
                                  <span className="block text-xs text-muted-foreground">SKU: {product.sku}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    product.status === 'active' ? 'default' : 
                                    product.status === 'draft' ? 'secondary' : 'outline'
                                  }
                                  className={product.status === 'archived' ? 'opacity-50' : ''}
                                  data-testid={`product-status-${product.id}`}
                                >
                                  {product.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {product.status === 'archived' && <Archive className="h-3 w-3 mr-1" />}
                                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`product-inventory-${product.id}`}>
                                {product.trackInventory ? (
                                  <span className={product.inventory !== null && product.inventory <= 5 ? 'text-destructive font-medium' : ''}>
                                    {product.inventory !== null && product.inventory <= 5 && (
                                      <AlertCircle className="h-3 w-3 inline mr-1" />
                                    )}
                                    {product.inventory ?? 0} in stock
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Not tracked</span>
                                )}
                              </TableCell>
                              <TableCell data-testid={`product-category-${product.id}`}>{product.category}</TableCell>
                              <TableCell data-testid={`product-price-${product.id}`}>
                                <div>
                                  ${product.price}
                                  {product.compareAtPrice && (
                                    <span className="block text-xs text-muted-foreground line-through">
                                      ${product.compareAtPrice}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
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
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : activeTab === 'inquiries' ? (
          <div className="space-y-4">
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              {inquiriesLoading ? (
                <div className="p-8 text-center text-muted-foreground" data-testid="loading-inquiries">
                  Loading inquiries...
                </div>
              ) : inquiries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground" data-testid="no-inquiries">
                  No service inquiries yet. When customers submit the form on the Services page, they'll appear here.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inquiry) => (
                      <TableRow 
                        key={inquiry.id} 
                        data-testid={`inquiry-row-${inquiry.id}`} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <TableCell className="text-muted-foreground">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{inquiry.customerName}</div>
                            <div className="text-xs text-muted-foreground">{inquiry.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`inquiry-service-${inquiry.id}`}>
                          {inquiry.serviceType}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select 
                            value={inquiry.status} 
                            onValueChange={(value) => updateInquiryStatusMutation.mutate({ id: inquiry.id, status: value })}
                          >
                            <SelectTrigger className="w-32 h-8" data-testid={`inquiry-status-${inquiry.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-blue-500" />
                                  New
                                </div>
                              </SelectItem>
                              <SelectItem value="in-progress">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-3 w-3 text-yellow-500" />
                                  In Progress
                                </div>
                              </SelectItem>
                              <SelectItem value="closed">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  Closed
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedInquiry(inquiry)}
                              data-testid={`button-view-inquiry-${inquiry.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this inquiry?')) {
                                  deleteInquiryMutation.mutate(inquiry.id);
                                }
                              }}
                              data-testid={`button-delete-inquiry-${inquiry.id}`}
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
        ) : activeTab === 'reviews' ? (
          <ReviewsManagement reviews={reviews} isLoading={reviewsLoading} queryClient={queryClient} toast={toast} />
        ) : activeTab === 'content' ? (
          <SiteContentManagement queryClient={queryClient} toast={toast} />
        ) : null}
      </div>

      {/* Inquiry Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-3">
              Service Inquiry #{selectedInquiry?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge 
                  variant={selectedInquiry.status === 'new' ? 'default' : selectedInquiry.status === 'in-progress' ? 'secondary' : 'outline'}
                  className={`text-sm px-3 py-1 ${
                    selectedInquiry.status === 'new' ? 'bg-blue-600' : 
                    selectedInquiry.status === 'in-progress' ? 'bg-yellow-500 text-black' : 
                    'bg-green-600 text-white'
                  }`}
                  data-testid="inquiry-detail-status"
                >
                  {selectedInquiry.status === 'new' && <Clock className="h-4 w-4 mr-1" />}
                  {selectedInquiry.status === 'in-progress' && <MessageSquare className="h-4 w-4 mr-1" />}
                  {selectedInquiry.status === 'closed' && <CheckCircle className="h-4 w-4 mr-1" />}
                  {selectedInquiry.status.charAt(0).toUpperCase() + selectedInquiry.status.slice(1)}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  Submitted on {new Date(selectedInquiry.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5" /> Customer Information
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="font-medium min-w-24">Name:</span>
                      <span data-testid="inquiry-detail-name">{selectedInquiry.customerName}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-medium min-w-24">Email:</span>
                      <a 
                        href={`mailto:${selectedInquiry.customerEmail}`} 
                        className="text-primary hover:underline"
                        data-testid="inquiry-detail-email"
                      >
                        {selectedInquiry.customerEmail}
                      </a>
                    </div>
                    {selectedInquiry.customerPhone && (
                      <div className="flex items-start gap-3">
                        <span className="font-medium min-w-24">Phone:</span>
                        <a 
                          href={`tel:${selectedInquiry.customerPhone}`} 
                          className="text-primary hover:underline flex items-center gap-1"
                          data-testid="inquiry-detail-phone"
                        >
                          <Phone className="h-4 w-4" />
                          {selectedInquiry.customerPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5" /> Service Type
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4" data-testid="inquiry-detail-service">
                    <p className="font-medium">{selectedInquiry.serviceType}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Description
                </h3>
                <div className="bg-muted/30 rounded-lg p-4" data-testid="inquiry-detail-description">
                  <p className="whitespace-pre-wrap">{selectedInquiry.description}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Admin Notes
                </h3>
                {editingInquiryNotes === selectedInquiry.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={inquiryNotesText}
                      onChange={(e) => setInquiryNotesText(e.target.value)}
                      placeholder="Add internal notes about this inquiry..."
                      rows={3}
                      data-testid="inquiry-notes-input"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => updateInquiryNotesMutation.mutate({ id: selectedInquiry.id, adminNotes: inquiryNotesText })}
                        data-testid="button-save-inquiry-notes"
                      >
                        Save Notes
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { setEditingInquiryNotes(null); setInquiryNotesText(""); }}
                        data-testid="button-cancel-inquiry-notes"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="bg-muted/30 rounded-lg p-4 cursor-pointer hover:bg-muted/50 min-h-16"
                    onClick={() => { setEditingInquiryNotes(selectedInquiry.id); setInquiryNotesText(selectedInquiry.adminNotes || ""); }}
                    data-testid="inquiry-notes-display"
                  >
                    {selectedInquiry.adminNotes ? (
                      <p className="whitespace-pre-wrap">{selectedInquiry.adminNotes}</p>
                    ) : (
                      <p className="text-muted-foreground italic">Click to add notes...</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <Select 
                  value={selectedInquiry.status} 
                  onValueChange={(value) => updateInquiryStatusMutation.mutate({ id: selectedInquiry.id, status: value })}
                >
                  <SelectTrigger className="w-40" data-testid="inquiry-detail-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this inquiry?')) {
                      deleteInquiryMutation.mutate(selectedInquiry.id);
                    }
                  }}
                  data-testid="button-delete-inquiry-detail"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Inquiry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-3">
              Order #{selectedOrder?.id}
              {selectedOrder?.archived && (
                <Badge variant="outline" className="text-sm">
                  <Archive className="h-3 w-3 mr-1" />
                  Archived
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge 
                  variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'secondary'}
                  className={`text-sm px-3 py-1 cursor-pointer ${selectedOrder.paymentStatus === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}
                  onClick={() => updatePaymentStatusMutation.mutate({ 
                    id: selectedOrder.id, 
                    paymentStatus: selectedOrder.paymentStatus === 'paid' ? 'unpaid' : 'paid' 
                  })}
                  data-testid="order-detail-payment-status"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  {selectedOrder.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                </Badge>
                <Badge 
                  variant="outline"
                  className="text-sm px-3 py-1"
                  data-testid="order-detail-fulfillment-status"
                >
                  {selectedOrder.fulfillmentStatus === 'shipped' && <Truck className="h-4 w-4 mr-1 text-blue-500" />}
                  {selectedOrder.fulfillmentStatus === 'delivered' && <CheckCircle className="h-4 w-4 mr-1 text-green-500" />}
                  {selectedOrder.fulfillmentStatus === 'fulfilled' && <CheckCircle className="h-4 w-4 mr-1 text-green-500" />}
                  {(selectedOrder.fulfillmentStatus === 'unfulfilled' || !selectedOrder.fulfillmentStatus) && <Package className="h-4 w-4 mr-1 text-yellow-500" />}
                  {(selectedOrder.fulfillmentStatus || 'unfulfilled').charAt(0).toUpperCase() + (selectedOrder.fulfillmentStatus || 'unfulfilled').slice(1)}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
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
                    {selectedOrder.customerPhone && (
                      <div className="flex items-start gap-3">
                        <span className="font-medium min-w-24">Phone:</span>
                        <a 
                          href={`tel:${selectedOrder.customerPhone}`} 
                          className="text-primary hover:underline flex items-center gap-1"
                          data-testid="order-detail-customer-phone"
                        >
                          <Phone className="h-4 w-4" />
                          {selectedOrder.customerPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Shipping Address
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4" data-testid="order-detail-address">
                    <p>{selectedOrder.shippingAddress}</p>
                    <p>{selectedOrder.shippingCity}{selectedOrder.shippingState ? `, ${selectedOrder.shippingState}` : ''} {selectedOrder.shippingZip}</p>
                  </div>
                </div>
              </div>

              {/* Repair Description */}
              {selectedOrder.repairDescription && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Repair/Work Order Details
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4" data-testid="order-detail-repair-description">
                    <p className="whitespace-pre-wrap">{selectedOrder.repairDescription}</p>
                  </div>
                </div>
              )}

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

              {/* Status Controls */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Fulfillment Status</h3>
                  <Select 
                    value={selectedOrder.fulfillmentStatus || 'unfulfilled'} 
                    onValueChange={(value) => {
                      updateFulfillmentStatusMutation.mutate({ id: selectedOrder.id, fulfillmentStatus: value });
                    }}
                  >
                    <SelectTrigger data-testid="order-detail-fulfillment-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Tracking Number</h3>
                  <div className="flex gap-2">
                    <Input 
                      value={selectedOrder.trackingNumber || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })}
                      placeholder="Enter tracking number"
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
                      {updateTrackingMutation.isPending ? "..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Admin Notes
                </h3>
                <div className="space-y-2">
                  <Textarea 
                    value={editingNotes === selectedOrder.id ? notesText : (selectedOrder.adminNotes || "")}
                    onChange={(e) => {
                      if (editingNotes !== selectedOrder.id) {
                        setEditingNotes(selectedOrder.id);
                        setNotesText(e.target.value);
                      } else {
                        setNotesText(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      if (editingNotes !== selectedOrder.id) {
                        setEditingNotes(selectedOrder.id);
                        setNotesText(selectedOrder.adminNotes || "");
                      }
                    }}
                    placeholder="Add internal notes about this order..."
                    rows={3}
                    data-testid="order-detail-notes"
                  />
                  {editingNotes === selectedOrder.id && (
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingNotes(null);
                          setNotesText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          updateNotesMutation.mutate({ 
                            id: selectedOrder.id, 
                            adminNotes: notesText 
                          });
                        }}
                        disabled={updateNotesMutation.isPending}
                        data-testid="order-detail-save-notes"
                      >
                        {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline"
                  onClick={() => archiveOrderMutation.mutate({ id: selectedOrder.id, archived: !selectedOrder.archived })}
                  data-testid="order-detail-archive"
                >
                  {selectedOrder.archived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Restore Order
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Order
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to permanently delete this order? This cannot be undone.')) {
                      deleteOrderMutation.mutate(selectedOrder.id);
                    }
                  }}
                  data-testid="order-detail-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm 
              product={editingProduct} 
              onSuccess={() => setEditingProduct(null)}
              existingCategories={Array.from(new Set(products.map(p => p.category)))}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProductOption {
  id?: number;
  name: string;
  values: string[];
}

interface ProductVariant {
  id?: number;
  title: string;
  optionValues: Record<string, string>;
  sku: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  trackInventory: boolean;
  inventory: string;
  imageUrl: string;
  status: string;
}

function ProductForm({ product, onSuccess, existingCategories = [] }: { product?: Product; onSuccess: () => void; existingCategories?: string[] }) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice?.toString() || "");
  const [cost, setCost] = useState(product?.cost?.toString() || "");
  const [category, setCategory] = useState(product?.category || "");
  const [productType, setProductType] = useState(product?.productType || "");
  const [brand, setBrand] = useState(product?.brand || "");
  const [color, setColor] = useState(product?.color || "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [status, setStatus] = useState(product?.status || "active");
  const [trackInventory, setTrackInventory] = useState(product?.trackInventory !== false);
  const [inventory, setInventory] = useState(product?.inventory?.toString() || "0");
  const [sku, setSku] = useState(product?.sku || "");
  const [tags, setTags] = useState(product?.tags || "");
  const [inStoreOnly, setInStoreOnly] = useState(product?.inStoreOnly || false);
  
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [additionalImages, setAdditionalImages] = useState<{ id?: number; url: string; altText?: string }[]>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  useEffect(() => {
    if (product?.id) {
      fetch(`/api/products/${product.id}/options`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            setProductOptions(data.map((o: any) => ({ id: o.id, name: o.name, values: o.values })));
          }
        })
        .catch(console.error);
      
      fetch(`/api/products/${product.id}/variants`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            setProductVariants(data.map((v: any) => ({
              id: v.id,
              title: v.title,
              optionValues: typeof v.optionValues === 'string' ? JSON.parse(v.optionValues) : v.optionValues,
              sku: v.sku || '',
              price: v.price?.toString() || '',
              compareAtPrice: v.compareAtPrice?.toString() || '',
              cost: v.cost?.toString() || '',
              trackInventory: v.trackInventory !== false,
              inventory: v.inventory?.toString() || '0',
              imageUrl: v.imageUrl || '',
              status: v.status || 'active',
            })));
          }
        })
        .catch(console.error);
      
      fetch(`/api/products/${product.id}/images`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setAdditionalImages(data.map((img: any) => ({ id: img.id, url: img.url, altText: img.altText })));
          }
        })
        .catch(console.error);
    }
  }, [product?.id]);

  const createProductMutation = useMutation({
    mutationFn: async (productData: Record<string, any>) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMsg = error.details ? `${error.error}: ${error.details}` : (error.error || 'Failed to create product');
        throw new Error(errorMsg);
      }
      return response.json();
    },
    onSuccess: async (createdProduct) => {
      if (createdProduct?.id) {
        await saveVariantsToServer(createdProduct.id);
        await saveImagesToServer(createdProduct.id);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product created successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: { id: number } & Record<string, any>) => {
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
    onSuccess: async (updatedProduct) => {
      if (updatedProduct?.id) {
        await saveVariantsToServer(updatedProduct.id);
        await saveImagesToServer(updatedProduct.id);
      }
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
    if (!category.trim()) {
      toast({ title: "Please enter a category", variant: "destructive" });
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
      compareAtPrice: compareAtPrice || null,
      cost: cost || null,
      category, 
      productType: productType || null,
      brand: brand || null,
      color: color || null,
      imageUrl,
      status,
      trackInventory,
      inventory: trackInventory ? parseInt(inventory) || 0 : null,
      sku: sku.trim() || null,
      tags: tags.trim() || null,
      inStoreOnly,
    };
    
    if (product) {
      updateProductMutation.mutate({ id: product.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;
  
  const addOption = () => {
    if (productOptions.length < 6) {
      setProductOptions([...productOptions, { name: '', values: [] }]);
    }
  };
  
  const removeOption = (index: number) => {
    const newOptions = productOptions.filter((_, i) => i !== index);
    setProductOptions(newOptions);
    if (newOptions.length === 0) {
      setProductVariants([]);
    }
  };
  
  const updateOption = (index: number, field: 'name' | 'values', value: string | string[]) => {
    const newOptions = [...productOptions];
    if (field === 'name') {
      newOptions[index].name = value as string;
    } else {
      newOptions[index].values = value as string[];
    }
    setProductOptions(newOptions);
  };
  
  const generateVariants = () => {
    const validOptions = productOptions.filter(o => o.name && o.values.length > 0);
    if (validOptions.length === 0) {
      toast({ title: "Add at least one option with values", variant: "destructive" });
      return;
    }
    
    const combinations: Record<string, string>[] = [];
    
    const generate = (optIndex: number, current: Record<string, string>) => {
      if (optIndex >= validOptions.length) {
        combinations.push({ ...current });
        return;
      }
      
      const opt = validOptions[optIndex];
      for (const val of opt.values) {
        generate(optIndex + 1, { ...current, [opt.name]: val });
      }
    };
    
    generate(0, {});
    
    const newVariants: ProductVariant[] = combinations.map(combo => {
      const title = Object.values(combo).join(' / ');
      const existingVariant = productVariants.find(v => v.title === title);
      
      return existingVariant || {
        title,
        optionValues: combo,
        sku: '',
        price: price || '',
        compareAtPrice: '',
        cost: '',
        trackInventory: true,
        inventory: '0',
        imageUrl: '',
        status: 'active',
      };
    });
    
    setProductVariants(newVariants);
    toast({ title: `Generated ${newVariants.length} variants` });
  };
  
  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...productVariants];
    (newVariants[index] as any)[field] = value;
    setProductVariants(newVariants);
  };
  
  const saveVariantsToServer = async (productId: number) => {
    const validOptions = productOptions.filter(o => o.name && o.values.length > 0);
    
    await fetch(`/api/products/${productId}/options`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: validOptions }),
    });
    
    await fetch(`/api/products/${productId}/variants`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variants: productVariants.map(v => ({
          ...v,
          price: v.price || price,
          inventory: v.trackInventory ? (parseInt(v.inventory) || 0) : null,
        })),
      }),
    });
  };

  const saveImagesToServer = async (productId: number) => {
    for (const img of additionalImages) {
      if (!img.id && img.url) {
        await fetch(`/api/products/${productId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: img.url, altText: img.altText }),
        });
      }
    }
  };

  const addImageSlot = () => {
    if (additionalImages.length < 9) {
      setAdditionalImages([...additionalImages, { url: '' }]);
    }
  };

  const updateAdditionalImage = (index: number, url: string) => {
    const newImages = [...additionalImages];
    newImages[index] = { ...newImages[index], url };
    setAdditionalImages(newImages);
  };

  const removeAdditionalImage = async (index: number) => {
    const img = additionalImages[index];
    if (img.id && product?.id) {
      await fetch(`/api/product-images/${img.id}`, { method: 'DELETE' });
    }
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  // Calculate profit margin
  const calculateMargin = () => {
    const priceNum = parseFloat(price) || 0;
    const costNum = parseFloat(cost) || 0;
    if (priceNum > 0 && costNum > 0) {
      const margin = ((priceNum - costNum) / priceNum) * 100;
      return margin.toFixed(1);
    }
    return null;
  };

  const margin = calculateMargin();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Basic information about your product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  rows={4}
                  data-testid="input-product-description"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Repair, Shoe Care, Leather Goods"
                  list="category-suggestions"
                  data-testid="input-product-category"
                />
                <datalist id="category-suggestions">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                  <option value="Repair" />
                  <option value="Shoe Care" />
                  <option value="Leather Goods" />
                  <option value="Orthotics" />
                  <option value="Accessories" />
                </datalist>
                <p className="text-xs text-muted-foreground mt-1">Select existing or type a new category</p>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input 
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="boots, leather, resole (comma separated)"
                  data-testid="input-product-tags"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Attributes</CardTitle>
              <CardDescription>Help customers find your product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productType">Product Type</Label>
                  <Input 
                    id="productType"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="Select or type new..."
                    list="product-type-suggestions"
                    data-testid="input-product-type"
                  />
                  <datalist id="product-type-suggestions">
                    {PRODUCT_TYPES.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground mt-1">Select existing or type a new type</p>
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input 
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Select or type new..."
                    list="brand-suggestions"
                    data-testid="input-product-brand"
                  />
                  <datalist id="brand-suggestions">
                    {BRANDS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground mt-1">Select existing or type a new brand</p>
                </div>
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input 
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g., Black, Brown, Neutral"
                  data-testid="input-product-color"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Control product visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-product-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-yellow-500" />
                      <span>Draft</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="archived">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-gray-500" />
                      <span>Archived</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {status === 'active' && "This product is visible on your storefront"}
                {status === 'draft' && "This product is hidden from customers"}
                {status === 'archived' && "This product is archived and hidden"}
              </p>

              <div className="flex items-center space-x-3 pt-4 border-t mt-4">
                <Checkbox
                  id="inStoreOnly"
                  checked={inStoreOnly}
                  onCheckedChange={(checked) => setInStoreOnly(checked === true)}
                  data-testid="checkbox-in-store-only"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="inStoreOnly" className="font-medium cursor-pointer">
                    In-Store Only (Gallery Item)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This product will appear in the Gallery instead of the Shop. Customers cannot purchase online.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Set your product pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="compareAtPrice">Compare-at Price ($)</Label>
                  <Input 
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="0.00"
                    data-testid="input-product-compare-price"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Original price for sale items</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="cost">Cost per Item ($)</Label>
                <Input 
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-product-cost"
                />
                <p className="text-xs text-muted-foreground mt-1">For profit calculation (not shown to customers)</p>
              </div>

              {margin && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className={`text-lg font-bold ${parseFloat(margin) > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {margin}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">Profit per item</span>
                    <span className="text-sm font-medium">
                      ${((parseFloat(price) || 0) - (parseFloat(cost) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Options</CardTitle>
              <CardDescription>Add options like Size or Color to create variants. Up to 6 options allowed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {productOptions.map((option, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Option {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      data-testid={`button-remove-option-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Option Name</Label>
                      <Input
                        placeholder="e.g., Size, Color"
                        value={option.name}
                        onChange={(e) => updateOption(index, 'name', e.target.value)}
                        data-testid={`input-option-name-${index}`}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Values (comma separated)</Label>
                      <Input
                        placeholder="e.g., Small, Medium, Large"
                        value={option.values.join(', ')}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          const values = rawValue.split(',').map(v => v.trimStart());
                          updateOption(index, 'values', values.filter(v => v.length > 0 || rawValue.endsWith(',')));
                        }}
                        onBlur={(e) => {
                          const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                          updateOption(index, 'values', values);
                        }}
                        data-testid={`input-option-values-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                {productOptions.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    data-testid="button-add-option"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Option
                  </Button>
                )}
                {productOptions.length > 0 && (
                  <Button
                    type="button"
                    onClick={generateVariants}
                    data-testid="button-generate-variants"
                  >
                    Generate Variants
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SKU</CardTitle>
              <CardDescription>Stock keeping unit for tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input 
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g., BOOT-RESOLE-001"
                  data-testid="input-product-sku"
                />
                <p className="text-xs text-muted-foreground mt-1">Unique identifier for this product</p>
              </div>
            </CardContent>
          </Card>

          {productVariants.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Variants ({productVariants.length})</CardTitle>
                <CardDescription>Set individual pricing and inventory for each variant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Variant</th>
                        <th className="text-left p-3 font-medium">Price ($)</th>
                        <th className="text-left p-3 font-medium">SKU</th>
                        <th className="text-left p-3 font-medium">Inventory</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productVariants.map((variant, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3 font-medium">{variant.title}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, 'price', e.target.value)}
                              placeholder={price || "0.00"}
                              className="w-24 h-8"
                              data-testid={`input-variant-price-${index}`}
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                              placeholder="SKU"
                              className="w-28 h-8"
                              data-testid={`input-variant-sku-${index}`}
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="0"
                              value={variant.inventory}
                              onChange={(e) => updateVariant(index, 'inventory', e.target.value)}
                              className="w-20 h-8"
                              data-testid={`input-variant-inventory-${index}`}
                            />
                          </td>
                          <td className="p-3">
                            <Select
                              value={variant.status}
                              onValueChange={(val) => updateVariant(index, 'status', val)}
                            >
                              <SelectTrigger className="w-24 h-8" data-testid={`select-variant-status-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Inventory</span>
                  </div>
                  <span className="text-sm font-bold">
                    {productVariants.reduce((sum, v) => sum + (parseInt(v.inventory) || 0), 0)} units
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Track stock levels for this product</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="inventory">Quantity in Stock</Label>
                  <Input 
                    id="inventory"
                    type="number"
                    min="0"
                    value={inventory}
                    onChange={(e) => setInventory(e.target.value)}
                    placeholder="0"
                    data-testid="input-product-inventory"
                  />
                  {parseInt(inventory) <= 5 && parseInt(inventory) >= 0 && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Low stock warning
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Main Product Image</CardTitle>
              <CardDescription>This is the primary image shown in listings</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                disabled={isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Images ({additionalImages.length}/9)</CardTitle>
              <CardDescription>Add up to 9 additional product images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {additionalImages.map((img, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <ImageUploader
                      value={img.url}
                      onChange={(url) => updateAdditionalImage(index, url)}
                      disabled={isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdditionalImage(index)}
                    className="text-destructive"
                    data-testid={`button-remove-image-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {additionalImages.length < 9 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageSlot}
                  data-testid="button-add-image"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Another Image
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 pt-4 border-t">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isPending}
          data-testid="button-save-product"
        >
          {isPending 
            ? "Saving..." 
            : product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

function ReviewsManagement({ reviews, isLoading, queryClient, toast }: { 
  reviews: Review[]; 
  isLoading: boolean; 
  queryClient: ReturnType<typeof useQueryClient>;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerLocation: "",
    rating: 5,
    content: "",
    imageUrl: "",
    featured: true,
  });

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerLocation: "",
      rating: 5,
      content: "",
      imageUrl: "",
      featured: true,
    });
    setEditingReview(null);
  };

  const createReviewMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          imageUrl: data.imageUrl || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/featured'] });
      setIsAddReviewOpen(false);
      resetForm();
      toast({ title: "Review created" });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          imageUrl: data.imageUrl || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/featured'] });
      setEditingReview(null);
      resetForm();
      toast({ title: "Review updated" });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete review');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/featured'] });
      toast({ title: "Review deleted" });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      });
      if (!response.ok) throw new Error('Failed to toggle featured');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/featured'] });
      toast({ title: "Featured status updated" });
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      });
      if (!response.ok) throw new Error('Failed to toggle published');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/published'] });
      toast({ title: "Published status updated" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReview) {
      updateReviewMutation.mutate({ id: editingReview.id, data: formData });
    } else {
      createReviewMutation.mutate(formData);
    }
  };

  const openEditDialog = (review: Review) => {
    setEditingReview(review);
    setFormData({
      customerName: review.customerName,
      customerLocation: review.customerLocation,
      rating: review.rating,
      content: review.content,
      imageUrl: review.imageUrl || "",
      featured: review.featured || false,
    });
    setIsAddReviewOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Manage customer reviews displayed on the homepage. Featured reviews (up to 3) appear on the home page.
        </p>
        <Dialog open={isAddReviewOpen} onOpenChange={(open) => {
          setIsAddReviewOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-review">
              <Plus className="h-4 w-4 mr-2" /> Add Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReview ? 'Edit Review' : 'Add Review'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="John M."
                    required
                    data-testid="input-review-name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerLocation">Location *</Label>
                  <Input
                    id="customerLocation"
                    value={formData.customerLocation}
                    onChange={(e) => setFormData({ ...formData, customerLocation: e.target.value })}
                    placeholder="Hyannis, MA"
                    required
                    data-testid="input-review-location"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="rating">Rating</Label>
                <Select 
                  value={formData.rating.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, rating: parseInt(v) })}
                >
                  <SelectTrigger data-testid="select-review-rating">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={r.toString()}>
                        {r} Star{r !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Review Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write the customer's review..."
                  rows={4}
                  required
                  data-testid="input-review-content"
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Photo URL (optional)</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-review-image"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  data-testid="switch-review-featured"
                />
                <Label htmlFor="featured">Featured on Homepage</Label>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={createReviewMutation.isPending || updateReviewMutation.isPending}
                data-testid="button-save-review"
              >
                {createReviewMutation.isPending || updateReviewMutation.isPending
                  ? 'Saving...'
                  : editingReview ? 'Update Review' : 'Create Review'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground" data-testid="loading-reviews">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" data-testid="no-reviews">
            No reviews yet. Add customer testimonials to display on the homepage.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id} data-testid={`review-row-${review.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {review.imageUrl ? (
                        <img 
                          src={review.imageUrl} 
                          alt={review.customerName} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{review.customerName}</div>
                        <div className="text-xs text-muted-foreground">{review.customerLocation}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground line-clamp-2">"{review.content}"</p>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={review.published || false}
                      onCheckedChange={(checked) => togglePublishedMutation.mutate({ id: review.id, published: checked })}
                      data-testid={`switch-published-${review.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={review.featured || false}
                      onCheckedChange={(checked) => toggleFeaturedMutation.mutate({ id: review.id, featured: checked })}
                      data-testid={`switch-featured-${review.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(review)}
                        data-testid={`button-edit-review-${review.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Delete this review?')) {
                            deleteReviewMutation.mutate(review.id);
                          }
                        }}
                        data-testid={`button-delete-review-${review.id}`}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-blue-800">
          <strong>Tip:</strong> Only featured reviews appear on the homepage. Toggle the "Featured" switch to control which reviews are displayed. Up to 3 featured reviews will be shown.
        </p>
      </div>
    </div>
  );
}

function SiteContentManagement({ queryClient, toast }: {
  queryClient: ReturnType<typeof useQueryClient>;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [aboutImageUrl, setAboutImageUrl] = useState("");

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");

  const { data: siteContent = [], isLoading } = useQuery<SiteContent[]>({
    queryKey: ['/api/site-content'],
    queryFn: async () => {
      const response = await fetch('/api/site-content');
      if (!response.ok) throw new Error('Failed to fetch site content');
      return response.json();
    },
  });

  useEffect(() => {
    const aboutUs = siteContent.find(c => c.key === 'about-us');
    if (aboutUs) {
      setAboutTitle(aboutUs.title || '');
      setAboutContent(aboutUs.content || '');
      setAboutImageUrl(aboutUs.imageUrl || '');
    }
    const hero = siteContent.find(c => c.key === 'hero');
    if (hero) {
      setHeroTitle(hero.title || '');
      setHeroSubtitle(hero.content || '');
      setHeroImageUrl(hero.imageUrl || '');
    }
  }, [siteContent]);

  const saveAboutUsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/site-content/about-us', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aboutTitle,
          content: aboutContent,
          imageUrl: aboutImageUrl || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to save about us content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-content'] });
      toast({
        title: "Content Saved",
        description: "About Us section has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveHeroMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/site-content/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: heroTitle,
          content: heroSubtitle,
          imageUrl: heroImageUrl || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to save hero content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-content'] });
      toast({
        title: "Content Saved",
        description: "Hero section has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Hero Section
          </CardTitle>
          <CardDescription>
            Edit the hero section at the top of the homepage. Leave empty to use defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitle">Hero Title</Label>
            <Input
              id="heroTitle"
              placeholder="Revive Your Sole"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              data-testid="input-hero-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
            <Textarea
              id="heroSubtitle"
              placeholder="Master craftsmanship for your beloved footwear..."
              rows={3}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              data-testid="input-hero-subtitle"
            />
          </div>

          <div className="space-y-2">
            <Label>Background Image (Optional)</Label>
            <div className="flex gap-4 items-start">
              {heroImageUrl && (
                <div className="relative w-48 h-24 rounded-lg overflow-hidden border">
                  <img src={heroImageUrl} alt="Hero background" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setHeroImageUrl('')}
                    data-testid="button-remove-hero-image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <ImageUploader
                  onUploadComplete={(url) => setHeroImageUrl(url)}
                  className="h-24"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={() => saveHeroMutation.mutate()}
              disabled={saveHeroMutation.isPending}
              data-testid="button-save-hero"
            >
              {saveHeroMutation.isPending ? 'Saving...' : 'Save Hero'}
            </Button>
            {(heroTitle || heroSubtitle || heroImageUrl) && (
              <Button 
                variant="outline"
                onClick={() => {
                  setHeroTitle('');
                  setHeroSubtitle('');
                  setHeroImageUrl('');
                }}
                data-testid="button-clear-hero"
              >
                Reset to Defaults
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            About Us Section
          </CardTitle>
          <CardDescription>
            Edit the About Us section that appears on the homepage. Leave empty to hide the section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aboutTitle">Section Title</Label>
            <Input
              id="aboutTitle"
              placeholder="About Us"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              data-testid="input-about-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutContent">Content</Label>
            <Textarea
              id="aboutContent"
              placeholder="Tell your story..."
              rows={8}
              value={aboutContent}
              onChange={(e) => setAboutContent(e.target.value)}
              data-testid="input-about-content"
            />
            <p className="text-xs text-muted-foreground">Use line breaks to create separate paragraphs.</p>
          </div>

          <div className="space-y-2">
            <Label>Image (Optional)</Label>
            <div className="flex gap-4 items-start">
              {aboutImageUrl && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <img src={aboutImageUrl} alt="About Us" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setAboutImageUrl('')}
                    data-testid="button-remove-about-image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <ImageUploader
                  onUploadComplete={(url) => setAboutImageUrl(url)}
                  className="h-32"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={() => saveAboutUsMutation.mutate()}
              disabled={saveAboutUsMutation.isPending}
              data-testid="button-save-about-us"
            >
              {saveAboutUsMutation.isPending ? 'Saving...' : 'Save About Us'}
            </Button>
            {(aboutTitle || aboutContent || aboutImageUrl) && (
              <Button 
                variant="outline"
                onClick={() => {
                  setAboutTitle('');
                  setAboutContent('');
                  setAboutImageUrl('');
                }}
                data-testid="button-clear-about-us"
              >
                Clear Section
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
        <p className="text-amber-800">
          <strong>Tip:</strong> The About Us section will only appear on the homepage if content is saved. Clear the section to hide it completely.
        </p>
      </div>
    </div>
  );
}
