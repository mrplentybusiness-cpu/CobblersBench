import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/mockData";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Shop() {
  const [filter, setFilter] = useState<'all' | 'repair' | 'goods' | 'care'>('all');

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
          >
            All Items
          </Button>
          <Button 
            variant={filter === 'repair' ? "default" : "outline"}
            onClick={() => setFilter('repair')}
            className="rounded-full"
          >
            Repairs
          </Button>
          <Button 
            variant={filter === 'care' ? "default" : "outline"}
            onClick={() => setFilter('care')}
            className="rounded-full"
          >
            Shoe Care
          </Button>
          <Button 
            variant={filter === 'goods' ? "default" : "outline"}
            onClick={() => setFilter('goods')}
            className="rounded-full"
          >
            Leather Goods
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
