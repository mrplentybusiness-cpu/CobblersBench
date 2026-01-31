import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCart } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { ImageOff, ShoppingBag, ExternalLink, Minus, Plus } from "lucide-react";
import { Link } from "wouter";

interface QuickViewDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickViewDialog({ product, open, onOpenChange }: QuickViewDialogProps) {
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open && product) {
      setQuantity(1);
      setImageError(false);
    }
  }, [open, product?.id]);

  if (!product) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} has been added to your cart.`,
    });
    setQuantity(1);
    onOpenChange(false);
  };

  const hasComparePrice = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
  const savingsPercent = hasComparePrice 
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice!)) * 100)
    : 0;

  const isOutOfStock = Boolean(product.trackInventory && product.inventory === 0);
  const maxQuantity = product.trackInventory && product.inventory ? product.inventory : 99;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid="quick-view-dialog">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Quick view of {product.name} - ${product.price}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {hasComparePrice && (
              <Badge variant="destructive" className="absolute top-3 left-3 z-10">
                Sale -{savingsPercent}%
              </Badge>
            )}
            {imageError ? (
              <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                <ImageOff className="h-16 w-16" />
              </div>
            ) : (
              <img
                src={product.imageUrl || ''}
                alt={product.name}
                className="h-full w-full object-cover object-center"
                onError={() => setImageError(true)}
                data-testid="quick-view-image"
              />
            )}
          </div>

          <div className="flex flex-col">
            <h2 className="font-serif text-2xl font-bold mb-2" data-testid="quick-view-name">
              {product.name}
            </h2>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold text-primary" data-testid="quick-view-price">
                ${product.price}
              </span>
              {hasComparePrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ${product.compareAtPrice}
                </span>
              )}
            </div>

            {product.category && (
              <Badge variant="secondary" className="w-fit mb-4">
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
              </Badge>
            )}

            <p className="text-muted-foreground mb-6 flex-1" data-testid="quick-view-description">
              {product.description}
            </p>

            {product.trackInventory && product.inventory !== null && product.inventory <= 5 && product.inventory > 0 && (
              <p className="text-sm text-amber-600 font-medium mb-4">
                Only {product.inventory} left in stock
              </p>
            )}

            {product.color && (
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">Colors:</span> {product.color}
              </p>
            )}

            {product.brand && (
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-medium">Brand:</span> {product.brand}
              </p>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="quick-view-quantity-minus"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium" data-testid="quick-view-quantity">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                  data-testid="quick-view-quantity-plus"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <Button 
                onClick={handleAddToCart}
                className="w-full"
                size="lg"
                disabled={isOutOfStock}
                data-testid="quick-view-add-to-cart"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                {isOutOfStock ? 'Out of Stock' : `Add to Order - $${(parseFloat(product.price) * quantity).toFixed(2)}`}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                asChild
                data-testid="quick-view-details-link"
              >
                <Link href={`/product/${product.id}`} onClick={() => onOpenChange(false)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
