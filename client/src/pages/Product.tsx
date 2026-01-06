import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Minus, Plus, ShoppingBag, ImageOff, Truck, Shield, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import type { Product, ProductOption, ProductVariant } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getImageUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('/objects/')) {
    return url;
  }
  return url;
}

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id ? parseInt(params.id) : null;
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Invalid product ID');
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return response.json();
    },
    enabled: productId !== null && productId > 0,
  });

  const { data: options = [] } = useQuery<ProductOption[]>({
    queryKey: ['/api/products', productId, 'options'],
    queryFn: async () => {
      if (!productId) return [];
      const response = await fetch(`/api/products/${productId}/options`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: productId !== null && productId > 0,
  });

  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ['/api/products', productId, 'variants'],
    queryFn: async () => {
      if (!productId) return [];
      const response = await fetch(`/api/products/${productId}/variants`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: productId !== null && productId > 0,
  });

  const hasVariants = options.length > 0 && variants.length > 0;

  useEffect(() => {
    if (options.length > 0 && Object.keys(selectedOptions).length === 0) {
      const defaultSelections: Record<string, string> = {};
      options.forEach(option => {
        if (option.values && option.values.length > 0) {
          defaultSelections[option.name] = option.values[0];
        }
      });
      setSelectedOptions(defaultSelections);
    }
  }, [options, selectedOptions]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants || Object.keys(selectedOptions).length === 0) return null;
    
    return variants.find(variant => {
      try {
        const variantOptions = typeof variant.optionValues === 'string' 
          ? JSON.parse(variant.optionValues) 
          : variant.optionValues;
        
        return options.every(option => 
          variantOptions[option.name] === selectedOptions[option.name]
        );
      } catch {
        return false;
      }
    }) || null;
  }, [hasVariants, selectedOptions, variants, options]);

  const displayPrice = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return product?.price || "0.00";
  }, [selectedVariant, product]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const cartItem = {
      ...product,
      price: displayPrice,
      name: selectedVariant 
        ? `${product.name} - ${selectedVariant.title}` 
        : product.name,
      variantId: selectedVariant?.id,
    };
    
    for (let i = 0; i < quantity; i++) {
      addToCart(cartItem);
    }
    toast({
      title: "Added to cart",
      description: `${quantity} x ${cartItem.name} added to your cart.`,
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'repair': return 'Repair Service';
      case 'care': return 'Shoe Care';
      case 'goods': return 'Leather Goods';
      default: return category;
    }
  };

  const isVariantAvailable = !hasVariants || (selectedVariant && selectedVariant.status === 'active');

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-serif mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/shop">
            <Button data-testid="button-back-to-shop">Back to Shop</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasComparePrice = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
  const savingsPercent = hasComparePrice 
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice!)) * 100)
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors" data-testid="link-back-to-shop">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted border">
              {imageError ? (
                <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                  <ImageOff className="h-24 w-24" />
                </div>
              ) : (
                <img
                  src={getImageUrl(selectedVariant?.imageUrl || product.imageUrl)}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                  onError={() => setImageError(true)}
                  data-testid="product-detail-image"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-3" data-testid="product-category-badge">
                {getCategoryLabel(product.category)}
              </Badge>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-4" data-testid="product-detail-name">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-primary" data-testid="product-detail-price">
                  ${displayPrice}
                </span>
                {hasComparePrice && !selectedVariant && (
                  <>
                    <span className="text-xl text-muted-foreground line-through" data-testid="product-compare-price">
                      ${product.compareAtPrice}
                    </span>
                    <Badge variant="destructive" data-testid="product-savings-badge">
                      Save {savingsPercent}%
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="prose prose-sm text-muted-foreground mb-6 flex-1" data-testid="product-detail-description">
              <p>{product.description}</p>
            </div>

            {hasVariants && (
              <div className="space-y-4 mb-6" data-testid="variant-options">
                {options.sort((a, b) => a.position - b.position).map(option => (
                  <div key={option.id} className="space-y-2">
                    <label className="text-sm font-medium" data-testid={`option-label-${option.name}`}>
                      {option.name}
                    </label>
                    <Select
                      value={selectedOptions[option.name] || ''}
                      onValueChange={(value) => handleOptionChange(option.name, value)}
                    >
                      <SelectTrigger className="w-full" data-testid={`option-select-${option.name}`}>
                        <SelectValue placeholder={`Select ${option.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {option.values?.map(value => (
                          <SelectItem key={value} value={value} data-testid={`option-value-${option.name}-${value}`}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {hasVariants && !selectedVariant && Object.keys(selectedOptions).length === options.length && (
                  <p className="text-sm text-amber-600">This combination is not available</p>
                )}
              </div>
            )}

            {product.trackInventory && product.inventory !== null && product.inventory <= 5 && product.inventory > 0 && (
              <p className="text-sm text-amber-600 font-medium mb-4" data-testid="product-low-stock">
                Only {product.inventory} left in stock
              </p>
            )}

            {product.trackInventory && product.inventory === 0 && (
              <p className="text-sm text-destructive font-medium mb-4" data-testid="product-out-of-stock">
                Out of stock
              </p>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-r-none"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium" data-testid="quantity-display">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-l-none"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={Boolean(product.trackInventory && product.inventory !== null && quantity >= product.inventory)}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg"
                onClick={handleAddToCart}
                disabled={Boolean(
                  (product.trackInventory && product.inventory === 0) ||
                  (hasVariants && !isVariantAvailable)
                )}
                data-testid="button-add-to-cart"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Add to Order - ${(parseFloat(displayPrice) * quantity).toFixed(2)}
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span>Free local pickup available</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span>Quality guaranteed craftsmanship</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <RefreshCw className="h-5 w-5 text-primary" />
                <span>Satisfaction guaranteed</span>
              </div>
            </div>

            {product.sku && (
              <p className="text-xs text-muted-foreground mt-6" data-testid="product-sku">
                SKU: {product.sku}
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
