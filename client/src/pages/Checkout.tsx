import Layout from "@/components/Layout";
import { useCart } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { AlertCircle, Wrench, Truck, Store, MapPin, Clock, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import type { SiteContent } from "@shared/schema";

const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  deliveryMethod: z.enum(["shipping", "pickup"]),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  repairDescription: z.string().optional(),
}).refine((data) => {
  if (data.deliveryMethod === "shipping") {
    return data.address && data.address.length >= 5 &&
           data.city && data.city.length >= 2 &&
           data.state && data.state.length >= 2 &&
           data.zipCode && data.zipCode.length >= 5;
  }
  return true;
}, {
  message: "Shipping address is required for delivery",
  path: ["address"],
});

const SHIPPING_RATE = 8.99;
const FREE_SHIPPING_THRESHOLD = 100;

export default function Checkout() {
  const { items, subtotal, shipping, tax, total, clearCart, setLastOrderId, deliveryMethod, setDeliveryMethod } = useCart();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const hasRepairItems = useMemo(() => {
    return items.some(item => item.category === 'repair');
  }, [items]);

  const currentSubtotal = subtotal();
  const currentShipping = shipping();
  const currentTax = tax();
  const currentTotal = total();

  const { data: paymentInfo } = useQuery<SiteContent | null>({
    queryKey: ["/api/site-content/payment-info"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/payment-info");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: businessInfo } = useQuery<SiteContent | null>({
    queryKey: ["/api/site-content/business-info"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/business-info");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const venmoHandle = paymentInfo?.title || "@Victor-Hadawar";
  const paymentInstructionText = paymentInfo?.content || "No payment is taken now - you'll receive the exact amount and instructions after placing your order.";
  const storeAddress = businessInfo?.title || "1600 Falmouth Rd";
  const storeCityStateZip = businessInfo?.content || "Centerville, MA 02632";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      deliveryMethod: deliveryMethod,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      repairDescription: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (hasRepairItems && (!values.repairDescription || values.repairDescription.trim().length < 10)) {
      form.setError("repairDescription", {
        type: "manual",
        message: "Please describe the repairs you need (at least 10 characters)"
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isPickup = values.deliveryMethod === "pickup";
      const orderData = {
        order: {
          customerName: values.fullName,
          customerEmail: values.email,
          customerPhone: values.phone,
          deliveryMethod: values.deliveryMethod,
          shippingAddress: isPickup ? "In-Store Pickup" : values.address,
          shippingCity: isPickup ? (storeCityStateZip.split(',')[0]?.trim() || "Centerville") : values.city,
          shippingState: isPickup ? (storeCityStateZip.split(',')[1]?.trim().split(' ')[0] || "MA") : values.state,
          shippingZip: isPickup ? (storeCityStateZip.split(',')[1]?.trim().split(' ')[1] || "02632") : values.zipCode,
          repairDescription: hasRepairItems ? values.repairDescription : null,
          total: currentTotal.toFixed(2),
          shipping: currentShipping.toFixed(2),
        },
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          productPrice: item.price.toString(),
          quantity: item.quantity,
          variantId: item.variantId || null,
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

  if (subtotal() === 0) {
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
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
                  <p className="text-sm text-muted-foreground mb-4">We'll use this to contact you about your order.</p>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} data-testid="input-fullName" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" type="email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone *</FormLabel>
                            <FormControl>
                              <Input placeholder="(508) 555-1234" type="tel" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-xl font-semibold mb-2">Delivery Method</h2>
                  <p className="text-sm text-muted-foreground mb-4">How would you like to receive your order?</p>
                  
                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              setDeliveryMethod(value as "shipping" | "pickup");
                            }}
                            defaultValue={field.value}
                            className="space-y-3"
                            data-testid="radio-deliveryMethod"
                          >
                            <div className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${deliveryMethod === "shipping" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}>
                              <RadioGroupItem value="shipping" id="shipping" className="mt-1" />
                              <Label htmlFor="shipping" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2 font-medium">
                                  <Truck className="h-4 w-4" />
                                  Ship to Me
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {currentSubtotal >= FREE_SHIPPING_THRESHOLD 
                                    ? "FREE shipping on orders over $100" 
                                    : `$${SHIPPING_RATE.toFixed(2)} standard shipping (Free over $100)`}
                                </p>
                              </Label>
                            </div>
                            
                            <div className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}>
                              <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                              <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2 font-medium">
                                  <Store className="h-4 w-4" />
                                  In-Store Pickup (FREE)
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{storeAddress}, {storeCityStateZip}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Mon-Fri 8AM-4PM, Sat 8AM-12PM</span>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {deliveryMethod === "shipping" && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Shipping Address</h2>
                      <p className="text-sm text-muted-foreground mb-4">Where should we ship your items?</p>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main Street" {...field} data-testid="input-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Centerville" {...field} data-testid="input-city" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State *</FormLabel>
                                <FormControl>
                                  <Input placeholder="MA" {...field} data-testid="input-state" />
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
                                <FormLabel>ZIP *</FormLabel>
                                <FormControl>
                                  <Input placeholder="02632" {...field} data-testid="input-zipCode" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {hasRepairItems && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Repair Work Order</h2>
                      </div>
                      
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Repair Order Details Required</AlertTitle>
                        <AlertDescription>
                          Since you're ordering repair services, please describe the work you need done. 
                          We'll contact you to verify and discuss your order.
                        </AlertDescription>
                      </Alert>
                      
                      <FormField
                        control={form.control}
                        name="repairDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Describe Your Repair Needs *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Please describe the repairs you need. For example: 'Resole my brown leather boots with Vibram soles. The heels are also worn and need replacing. Size 10.'"
                                className="min-h-[120px]"
                                {...field} 
                                data-testid="input-repairDescription" 
                              />
                            </FormControl>
                            <FormDescription>
                              Include shoe type, size, color, and specific repairs needed. The more detail, the better!
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 space-y-4">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
                    <Checkbox
                      id="terms-agreement"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      data-testid="checkbox-terms-agreement"
                      className="mt-0.5"
                    />
                    <label htmlFor="terms-agreement" className="text-sm leading-relaxed cursor-pointer select-none">
                      I have read and agree to the{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5"
                        data-testid="link-terms-checkout"
                      >
                        Terms of Service
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-lg h-12"
                    disabled={isSubmitting || !agreedToTerms}
                    data-testid="button-submit-order"
                  >
                    {isSubmitting ? "Placing Order..." : `Place Order ($${currentTotal.toFixed(2)})`}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Payment instructions will be provided on the next page.
                  </p>
                </div>
              </form>
            </Form>
          </div>

          <div className="space-y-6">
            <div className="bg-muted/30 p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                      {item.category === 'repair' && (
                        <span className="ml-1 text-xs text-primary">(Repair)</span>
                      )}
                    </span>
                    <span>${(parseFloat(String(item.price)) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${currentSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping {deliveryMethod === "pickup" && "(Pickup)"}</span>
                  <span>{currentShipping === 0 ? 'FREE' : `$${currentShipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>MA Sales Tax (6.25%)</span>
                  <span>${currentTax.toFixed(2)}</span>
                </div>
                {deliveryMethod === "shipping" && currentSubtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-xs text-muted-foreground">
                    Add ${(FREE_SHIPPING_THRESHOLD - currentSubtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${currentTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              
              <div className="bg-background p-4 rounded-md border">
                <h3 className="font-bold mb-2">Venmo Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Pay via Venmo to <strong>{venmoHandle}</strong>. {paymentInstructionText}
                </p>
              </div>
            </div>

            {hasRepairItems && (
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Shipping Your Items for Repair
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  After placing your order, please mail your items to:
                </p>
                <address className="text-sm not-italic bg-background p-3 rounded border">
                  <strong>Cobbler's Bench</strong><br />
                  {storeAddress}<br />
                  {storeCityStateZip}
                </address>
                <p className="text-xs text-muted-foreground mt-3">
                  Include a copy of your order confirmation with your package.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
