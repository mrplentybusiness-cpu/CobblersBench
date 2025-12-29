import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Confirmation() {
  const { toast } = useToast();

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

        <div className="bg-card border rounded-xl p-8 shadow-sm mb-8 text-left">
          <h2 className="font-serif text-2xl font-bold mb-4 text-center border-b pb-4">Final Step: Payment</h2>
          <p className="mb-6 text-center">
            To finalize your shipment, please send the total amount via Venmo or Zelle. 
            We will process your order immediately upon receipt.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-[#008CFF] text-white p-2 rounded font-bold text-xs">Venmo</div>
                <span className="font-medium">@CobblersBench-Pay</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard("@CobblersBench-Pay")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-[#6D1ED4] text-white p-2 rounded font-bold text-xs">Zelle</div>
                <span className="font-medium">pay@cobblersbench.com</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard("pay@cobblersbench.com")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Button variant="outline" className="mr-4" asChild>
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </Layout>
  );
}
