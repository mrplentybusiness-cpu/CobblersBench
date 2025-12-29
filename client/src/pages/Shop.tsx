import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

export default function Shop() {
  const [filter, setFilter] = useState<'all' | 'repair' | 'goods' | 'care'>('all');

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <Layout>
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold mb-4">Shop & Services</h1>
          <p className="text-muted-foreground max-w-2xl">
            Browse our repair services, care products, and handcrafted leather goods. 
            Select a service to add it to your order.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button 
            variant={filter === 'all' ? "default" : "outline"}
            onClick={() => setFilter('all')}
            className="rounded-full"
            data-testid="filter-all"
          >
            All Items
          </Button>
          <Button 
            variant={filter === 'repair' ? "default" : "outline"}
            onClick={() => setFilter('repair')}
            className="rounded-full"
            data-testid="filter-repair"
          >
            Repairs
          </Button>
          <Button 
            variant={filter === 'care' ? "default" : "outline"}
            onClick={() => setFilter('care')}
            className="rounded-full"
            data-testid="filter-care"
          >
            Shoe Care
          </Button>
          <Button 
            variant={filter === 'goods' ? "default" : "outline"}
            onClick={() => setFilter('goods')}
            className="rounded-full"
            data-testid="filter-goods"
          >
            Leather Goods
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12" data-testid="loading-products">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12" data-testid="error-products">
            <p className="text-destructive">Failed to load products. Please try again.</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12" data-testid="no-products">
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
