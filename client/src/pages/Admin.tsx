import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { products } from "@/lib/mockData";
import { Trash2, Plus, Package } from "lucide-react";
import logo from "@assets/Transparent_Cobbler's_Bench_Logo_1767042558581.png";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');

  // Mock Orders
  const [orders, setOrders] = useState([
    { id: "ORD-001", customer: "Alice Smith", status: "Pending Payment", total: 85.00, date: "2023-10-25" },
    { id: "ORD-002", customer: "Bob Jones", status: "Paid", total: 120.00, date: "2023-10-24" },
    { id: "ORD-003", customer: "Charlie Day", status: "Shipped", total: 45.00, date: "2023-10-23" },
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password (hint: admin123)");
    }
  };

  const updateStatus = (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

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
            />
            <Button type="submit" className="w-full">Access Dashboard</Button>
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
          >
            <Package className="mr-2 h-4 w-4" /> Orders
          </Button>
          <Button 
            variant={activeTab === 'products' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('products')}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === 'Paid' ? 'secondary' : 
                        order.status === 'Shipped' ? 'default' : 'outline'
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <select 
                        className="text-sm border rounded p-1"
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
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
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add New Product
              </Button>
            </div>
            
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
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
                    <TableRow key={product.id}>
                      <TableCell>
                        <img src={product.image} alt={product.name} className="h-10 w-10 rounded object-cover bg-muted" />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
