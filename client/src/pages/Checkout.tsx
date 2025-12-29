import Layout from "@/components/Layout";
import { useCart } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  zipCode: z.string().min(5, "Zip code is required"),
});

export default function Checkout() {
  const { total, clearCart } = useCart();
  const [, setLocation] = useLocation();

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, we would send this to the backend
    console.log(values);
    clearCart();
    setLocation("/confirmation");
  }

  if (total() === 0) {
    // Redirect empty cart
    setLocation("/cart");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-serif text-3xl font-bold mb-8 text-center">Checkout</h1>

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
                        <Input placeholder="John Doe" {...field} />
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
                        <Input placeholder="john@example.com" type="email" {...field} />
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
                        <Input placeholder="123 Cobbler Ln" {...field} />
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
                          <Input placeholder="New York" {...field} />
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
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-6">
                  <Button type="submit" className="w-full text-lg h-12 bg-primary hover:bg-primary/90">
                    Place Order (${total().toFixed(2)})
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
