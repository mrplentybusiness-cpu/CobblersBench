import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, Copy, Package, Wrench, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import type { Order, OrderItem } from "@shared/schema";

export default function Confirmation() {
  const { toast } = useToast();
  const { lastOrderId } = useCart();

  const { data: order, isLoading } = useQuery<Order & { items: OrderItem[] }>({
    queryKey: ['/api/orders', lastOrderId],
    queryFn: async () => {
      if (!lastOrderId) throw new Error('No order ID');
      const response = await fetch(`/api/orders/${lastOrderId}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      return response.json();
    },
    enabled: !!lastOrderId,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Payment handle copied to clipboard.",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        </div>

        <h1 className="font-serif text-4xl font-bold mb-4">Order Placed!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Thank you for your order. We have received your details.
        </p>

        {isLoading && (
          <div className="bg-card border rounded-xl p-8 shadow-sm mb-8" data-testid="loading-order">
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        )}

        {order && (
          <>
            <div className="bg-card border rounded-xl p-8 shadow-sm mb-8 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-serif text-xl font-bold">Order #{order.id}</h2>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium" data-testid="text-order-status">{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium" data-testid="text-order-total">${order.total}</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking:</span>
                    <span className="font-medium" data-testid="text-tracking-number">{order.trackingNumber}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm" data-testid={`order-item-${item.id}`}>
                      <span className="text-muted-foreground">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="font-medium">${(parseFloat(item.productPrice.toString()) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping To
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{order.customerName}</p>
                  <p>{order.shippingAddress}</p>
                  <p>{order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ''} {order.shippingZip}</p>
                  {order.customerPhone && (
                    <p className="flex items-center gap-1 mt-2">
                      <Phone className="h-3 w-3" /> {order.customerPhone}
                    </p>
                  )}
                  <p className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {order.customerEmail}
                  </p>
                </div>
              </div>

              {order.repairDescription && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Repair Description
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded" data-testid="text-repair-description">
                    {order.repairDescription}
                  </p>
                </div>
              )}
            </div>

            {order.repairDescription && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 shadow-sm mb-8 text-left">
                <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Next Step: Ship Your Items
                </h2>
                <p className="mb-4 text-muted-foreground">
                  Please mail your items for repair to:
                </p>
                <address className="not-italic bg-background p-4 rounded border mb-4">
                  <strong>Cobbler's Bench</strong><br />
                  1600 Falmouth Rd (Route 28)<br />
                  Centerville, MA 02632
                </address>
                <p className="text-sm text-muted-foreground">
                  Print this confirmation page and include it with your package. 
                  We will call you at {order.customerPhone || 'the phone number provided'} to verify and discuss your repair.
                </p>
              </div>
            )}

            <div className="bg-card border rounded-xl p-8 shadow-sm mb-8 text-left">
              <h2 className="font-serif text-2xl font-bold mb-4 text-center border-b pb-4">Final Step: Payment</h2>
              <p className="mb-6 text-center">
                To finalize your shipment, please send <strong className="text-primary">${order.total}</strong> via Venmo or Zelle. 
                We will process your order immediately upon receipt.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#008CFF] text-white p-2 rounded font-bold text-xs">Venmo</div>
                    <span className="font-medium">@CobblersBench-Pay</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard("@CobblersBench-Pay")}
                    data-testid="button-copy-venmo"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#6D1ED4] text-white p-2 rounded font-bold text-xs">Zelle</div>
                    <span className="font-medium">pay@cobblersbench.com</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard("pay@cobblersbench.com")}
                    data-testid="button-copy-zelle"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <Button variant="outline" className="mr-4" asChild data-testid="button-home">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild data-testid="button-shop">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </Layout>
  );
}
