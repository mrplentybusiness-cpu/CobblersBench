import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { Loader2, Store, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Gallery() {
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/gallery'],
    queryFn: async () => {
      const response = await fetch('/api/products/gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery products');
      return response.json();
    },
  });

  return (
    <Layout>
      <div className="bg-gradient-to-b from-amber-50 to-background py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Store className="h-8 w-8 text-amber-600" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold" data-testid="gallery-title">
              In-Store Gallery
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mb-4" data-testid="gallery-description">
            Browse our exclusive collection of handcrafted leather goods and specialty items. 
            These unique pieces are available for purchase in-store only.
          </p>
          <div className="flex items-center gap-2 text-amber-700 bg-amber-100 rounded-lg px-4 py-3 w-fit">
            <MapPin className="h-5 w-5" />
            <span className="font-medium">Visit us: 1600 Falmouth Rd, Centerville, MA 02632</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500" data-testid="gallery-error">
            Failed to load gallery items. Please try again later.
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20" data-testid="gallery-empty">
            <Store className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
              Gallery Coming Soon
            </h2>
            <p className="text-muted-foreground">
              Check back soon for our exclusive in-store collection.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <p className="text-muted-foreground">
                {products.length} {products.length === 1 ? 'item' : 'items'} available in-store
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="gallery-grid">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden group" data-testid={`gallery-item-${product.id}`}>
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <Badge className="absolute top-3 right-3 bg-amber-600 hover:bg-amber-700">
                      In-Store Only
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-serif text-xl font-semibold mb-2">{product.name}</h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-amber-700">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Visit store to purchase
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="mt-16 bg-muted/50 rounded-2xl p-8 text-center">
          <h2 className="font-serif text-2xl font-bold mb-3">Visit Our Shop</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Stop by to see these beautiful pieces in person. Our craftsmen are happy to answer 
            any questions and help you find the perfect item.
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>Address:</strong> 1600 Falmouth Rd, Centerville, MA 02632</p>
            <p><strong>Hours:</strong> Mon-Fri 8AM-4PM, Sat 8AM-12PM</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
