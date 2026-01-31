import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroBg from "@assets/stock_images/leather_cobbler_work_faee252e.jpg";
import { ArrowRight, Star, ShieldCheck, Clock, Quote, User } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import type { Product, Review, SiteContent } from "@shared/schema";


export default function Home() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/active'],
    queryFn: async () => {
      const response = await fetch('/api/products/active');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const { data: featuredReviews = [] } = useQuery<Review[]>({
    queryKey: ['/api/reviews/featured'],
    queryFn: async () => {
      const response = await fetch('/api/reviews/featured');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
  });

  const { data: aboutUs } = useQuery<SiteContent | null>({
    queryKey: ['/api/site-content/about-us'],
    queryFn: async () => {
      const response = await fetch('/api/site-content/about-us');
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch about us content');
      return response.json();
    },
  });

  const { data: heroContent } = useQuery<SiteContent | null>({
    queryKey: ['/api/site-content/hero'],
    queryFn: async () => {
      const response = await fetch('/api/site-content/hero');
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch hero content');
      return response.json();
    },
  });

  const { data: valueProps } = useQuery<SiteContent | null>({
    queryKey: ['/api/site-content/value-props'],
    queryFn: async () => {
      const response = await fetch('/api/site-content/value-props');
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch value props');
      return response.json();
    },
  });

  const { data: ctaContent } = useQuery<SiteContent | null>({
    queryKey: ['/api/site-content/homepage-cta'],
    queryFn: async () => {
      const response = await fetch('/api/site-content/homepage-cta');
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch CTA content');
      return response.json();
    },
  });

  const props = valueProps?.imageUrls || [];
  const valueProp1Title = props[0] || "Master Craftsmanship";
  const valueProp1Desc = props[1] || "Over 40 years of experience in traditional shoe making and repair.";
  const valueProp2Title = props[2] || "Quality Materials";
  const valueProp2Desc = props[3] || "We use only premium leathers and durable Vibram soles.";
  const valueProp3Title = props[4] || "Quick Turnaround";
  const valueProp3Desc = props[5] || "Most repairs completed within 3-5 business days.";

  const testimonials = featuredReviews.slice(0, 3);
  
  const featuredProducts = products.slice(0, 3);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[600px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroContent?.imageUrl || heroBg} 
            alt="Cobbler Workshop" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative container mx-auto px-4 text-center z-10">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-md animate-in slide-in-from-bottom-5 duration-700">
            {heroContent?.title || "Revive Your Sole"}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed animate-in slide-in-from-bottom-5 duration-700 delay-150">
            {heroContent?.content || "Master craftsmanship for your beloved footwear and leather goods. We restore quality, comfort, and style, one stitch at a time."}
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
              <h3 className="font-serif text-xl font-bold mb-2">{valueProp1Title}</h3>
              <p className="text-muted-foreground">{valueProp1Desc}</p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-xl bg-secondary/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">{valueProp2Title}</h3>
              <p className="text-muted-foreground">{valueProp2Desc}</p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-xl bg-secondary/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">{valueProp3Title}</h3>
              <p className="text-muted-foreground">{valueProp3Desc}</p>
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

      {/* About Us Section - only shown when content exists */}
      {aboutUs && (
        <section className="py-20 bg-background" data-testid="about-us-section">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {aboutUs.imageUrl && (
                <div className="relative">
                  <img 
                    src={aboutUs.imageUrl} 
                    alt={aboutUs.title || "About Cobbler's Bench"} 
                    className="rounded-xl shadow-lg w-full h-auto object-cover"
                  />
                </div>
              )}
              <div className={aboutUs.imageUrl ? "" : "md:col-span-2 text-center"}>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-foreground">
                  {aboutUs.title || "About Us"}
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-4">
                  {aboutUs.content?.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Customer Stories Section - only shown when there are featured reviews */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-foreground">Customer Stories</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Hear from our satisfied customers about their experience with Cobbler's Bench.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-muted/30 rounded-xl p-6 relative" data-testid={`testimonial-${testimonial.id}`}>
                  <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
                  <div className="flex items-center gap-4 mb-4">
                    {testimonial.imageUrl ? (
                      <img 
                        src={testimonial.imageUrl} 
                        alt={`${testimonial.customerName}, satisfied customer from ${testimonial.customerLocation}`} 
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">{testimonial.customerName}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.customerLocation}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">"{testimonial.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
            {ctaContent?.title || "Ready to restore your favorites?"}
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-10 text-lg">
            {ctaContent?.content || "Don't throw away quality footwear. Give them a second life with our expert repair services."}
          </p>
          <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-lg px-8" asChild>
            <Link href="/services">
              Our Services
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
