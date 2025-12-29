import Layout from "@/components/Layout";
import { useCart } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  zipCode: z.string().min(5, "Zip code is required"),
});

export default function Checkout() {
  const { items, total, clearCart, setLastOrderId } = useCart();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      address: "",
      city: "",
      zipCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        order: {
          customerName: values.fullName,
          customerEmail: values.email,
          shippingAddress: values.address,
          shippingCity: values.city,
          shippingZip: values.zipCode,
          total: total().toFixed(2),
        },
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          productPrice: item.price.toString(),
          quantity: item.quantity,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      setLastOrderId(order.id);
      clearCart();
      setLocation("/confirmation");
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (total() === 0) {
    setLocation("/cart");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-serif text-3xl font-bold mb-8 text-center">Checkout</h1>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-6" data-testid="error-checkout">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Shipping Information</h2>
              <p className="text-sm text-muted-foreground">Where should we send your items?</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="input-fullName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Cobbler Ln" {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} data-testid="input-zipCode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full text-lg h-12 bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                    data-testid="button-submit-order"
                  >
                    {isSubmitting ? "Placing Order..." : `Place Order ($${total().toFixed(2)})`}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    By placing this order, you agree to our Terms of Service. 
                    Payment instructions will be provided on the next page.
                  </p>
                </div>
              </form>
            </Form>
          </div>

          {/* Payment Info Preview */}
          <div className="bg-muted/30 p-8 rounded-lg border h-fit">
            <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
            
            <div className="bg-background p-4 rounded-md border mb-6">
              <h3 className="font-bold mb-2">Manual Payment</h3>
              <p className="text-sm text-muted-foreground">
                We accept Venmo and Zelle. 
                <br /><br />
                <strong>Note:</strong> No payment is taken right now. You will receive instructions to complete your payment manually after placing the order.
              </p>
            </div>

            <Separator className="my-6" />

            <div className="space-y-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total to Pay</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
