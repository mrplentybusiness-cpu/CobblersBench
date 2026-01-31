import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Product, SiteContent } from "@shared/schema";
import { PRODUCT_TYPES, BRANDS } from "@shared/schema";
import { Loader2, Grid3X3, LayoutGrid, X, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Shop() {
  const [filter, setFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [gridSize, setGridSize] = useState<'normal' | 'large'>('normal');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/active'],
    queryFn: async () => {
      const response = await fetch('/api/products/active');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const { data: shopCta } = useQuery<SiteContent | null>({
    queryKey: ['/api/site-content/shop-cta'],
    queryFn: async () => {
      const response = await fetch('/api/site-content/shop-cta');
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch shop CTA');
      return response.json();
    },
  });

  const availableCategories = useMemo(() => {
    const categories = products.map(p => p.category).filter(Boolean) as string[];
    return Array.from(new Set(categories)).sort();
  }, [products]);

  const availableBrands = useMemo(() => {
    const brands = products.map(p => p.brand).filter(Boolean) as string[];
    return Array.from(new Set(brands)).sort();
  }, [products]);

  const availableProductTypes = useMemo(() => {
    const types = products.map(p => p.productType).filter(Boolean) as string[];
    return Array.from(new Set(types)).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
      if (productTypeFilter !== 'all' && p.productType !== productTypeFilter) return false;
      return true;
    });
  }, [products, filter, brandFilter, productTypeFilter]);

  const activeFiltersCount = [
    filter !== 'all',
    brandFilter !== 'all',
    productTypeFilter !== 'all',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilter('all');
    setBrandFilter('all');
    setProductTypeFilter('all');
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return products.length;
    return products.filter(p => p.category === category).length;
  };

  const getFilterLabel = () => {
    if (filter === 'all') return 'All Products';
    return filter.charAt(0).toUpperCase() + filter.slice(1);
  };

  const getFilterDescription = () => {
    if (filter === 'all') return 'Browse our complete collection';
    return `Browse our ${filter.toLowerCase()} products`;
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-muted/50 to-background py-16 border-b">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" data-testid="shop-title">
            {getFilterLabel()}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl" data-testid="shop-description">
            {getFilterDescription()}
          </p>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-4" data-testid="product-count">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === 'all' ? "default" : "outline"}
              onClick={() => setFilter('all')}
              className="rounded-full"
              data-testid="filter-all"
            >
              All Products
              <Badge 
                variant={filter === 'all' ? "secondary" : "outline"} 
                className="ml-2 text-xs"
              >
                {products.length}
              </Badge>
            </Button>
            {availableCategories.map((category) => (
              <Button 
                key={category}
                variant={filter === category ? "default" : "outline"}
                onClick={() => setFilter(category)}
                className="rounded-full"
                data-testid={`filter-${category}`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
                <Badge 
                  variant={filter === category ? "secondary" : "outline"} 
                  className="ml-2 text-xs"
                >
                  {getCategoryCount(category)}
                </Badge>
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">View:</span>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={gridSize === 'normal' ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setGridSize('normal')}
                data-testid="grid-normal"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridSize === 'large' ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setGridSize('large')}
                data-testid="grid-large"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {(availableBrands.length > 0 || availableProductTypes.length > 0) && (
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>
            
            {availableProductTypes.length > 0 && (
              <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-product-type">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableProductTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {availableBrands.length > 0 && (
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-[150px]" data-testid="filter-brand">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {availableBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
                data-testid="clear-filters"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24" data-testid="loading-products">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-24 border rounded-lg bg-muted/20" data-testid="error-products">
            <p className="text-destructive mb-4">Failed to load products.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 border rounded-lg bg-muted/20" data-testid="no-products">
                <p className="text-muted-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your filters
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div 
                className={`grid gap-6 ${
                  gridSize === 'large' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className="mt-16 py-12 border-t text-center">
            <h2 className="font-serif text-2xl font-semibold mb-4">
              {shopCta?.title || "Need Something Custom?"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              {shopCta?.content || "We specialize in custom leather work and specialty repairs. Contact us to discuss your unique project."}
            </p>
            <Button variant="outline" size="lg" asChild>
              <a href="tel:+15087756221" data-testid="button-call-us">
                Call (508) 775-6221
              </a>
            </Button>
          </div>
        )}
      </div>

      <QuickViewDialog 
        product={quickViewProduct} 
        open={quickViewOpen} 
        onOpenChange={setQuickViewOpen} 
      />
    </Layout>
  );
}
