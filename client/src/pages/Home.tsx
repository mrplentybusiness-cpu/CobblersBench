import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroBg from "@assets/stock_images/leather_cobbler_work_faee252e.jpg";
import { ArrowRight, Star, ShieldCheck, Clock } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

export default function Home() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/active'],
    queryFn: async () => {
      const response = await fetch('/api/products/active');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });
  
  const featuredProducts = products.slice(0, 3);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[600px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroBg} 
            alt="Cobbler Workshop" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative container mx-auto px-4 text-center z-10">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-md animate-in slide-in-from-bottom-5 duration-700">
            Revive Your Sole
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed animate-in slide-in-from-bottom-5 duration-700 delay-150">
            Master craftsmanship for your beloved footwear and leather goods. 
            We restore quality, comfort, and style, one stitch at a time.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 rounded-full animate-in slide-in-from-bottom-5 duration-700 delay-300" asChild>
            <Link href="/services">
              Our Services <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 rounded-xl bg-secondary/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">Master Craftsmanship</h3>
              <p className="text-muted-foreground">Over 40 years of experience in traditional shoe making and repair.</p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-xl bg-secondary/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">Quality Materials</h3>
              <p className="text-muted-foreground">We use only premium leathers and durable Vibram soles.</p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-xl bg-secondary/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">Quick Turnaround</h3>
              <p className="text-muted-foreground">Most repairs completed within 3-5 business days.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-foreground">Our Services & Goods</h2>
              <p className="text-muted-foreground">Hand-picked restorations and premium care products.</p>
            </div>
            <Link href="/shop" className="text-primary hover:text-primary/80 font-medium hidden md:flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/shop">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">Ready to restore your favorites?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-10 text-lg">
            Don't throw away quality footwear. Give them a second life with our expert repair services.
          </p>
          <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-lg px-8" asChild>
            <Link href="/shop">
              Start an Order
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
