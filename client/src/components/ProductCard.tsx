import { useState } from "react";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { ImageOff, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const hasComparePrice = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
  const savingsPercent = hasComparePrice 
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice!)) * 100)
    : 0;

  return (
    <Link href={`/product/${product.id}`} className="block">
      <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg hover:border-primary/20 flex flex-col h-full" data-testid={`product-card-${product.id}`}>
        {hasComparePrice && (
          <Badge variant="destructive" className="absolute top-3 left-3 z-10" data-testid={`product-sale-badge-${product.id}`}>
            Sale -{savingsPercent}%
          </Badge>
        )}
        
        <div className="aspect-square w-full overflow-hidden bg-muted">
          {imageError ? (
            <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
              <ImageOff className="h-12 w-12" />
            </div>
          ) : (
            <img
              src={product.imageUrl || ''}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
              data-testid={`product-image-${product.id}`}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-serif text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1" data-testid={`product-description-${product.id}`}>
            {product.description}
          </p>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
              ${product.price}
            </span>
            {hasComparePrice && (
              <span className="text-sm text-muted-foreground line-through" data-testid={`product-compare-price-${product.id}`}>
                ${product.compareAtPrice}
              </span>
            )}
          </div>
          
          {product.trackInventory && product.inventory !== null && product.inventory <= 5 && product.inventory > 0 && (
            <p className="text-xs text-amber-600 font-medium mb-3">
              Only {product.inventory} left
            </p>
          )}
          
          <Button 
            onClick={handleAddToCart} 
            className="w-full"
            variant="default"
            disabled={Boolean(product.trackInventory && product.inventory === 0)}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            {product.trackInventory && product.inventory === 0 ? 'Out of Stock' : 'Add to Order'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
