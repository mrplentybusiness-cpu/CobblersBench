import { useCompare } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { X, GitCompareArrows, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

export default function CompareTray() {
  const { productIds, removeFromCompare, clearCompare } = useCompare();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/active'],
    enabled: productIds.length > 0,
  });

  const compareProducts = products.filter(p => productIds.includes(p.id));

  if (productIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 p-4" data-testid="compare-tray">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 text-sm font-medium shrink-0">
            <GitCompareArrows className="h-4 w-4" />
            Compare ({productIds.length}/4)
          </div>
          <div className="flex gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              compareProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="relative group shrink-0"
                  data-testid={`compare-tray-item-${product.id}`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden border bg-muted">
                    <img 
                      src={product.imageUrl || ''} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-remove-compare-${product.id}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearCompare}
            data-testid="button-clear-compare"
          >
            Clear
          </Button>
          <Button 
            size="sm" 
            asChild
            disabled={productIds.length < 2}
            data-testid="button-compare-now"
          >
            <Link href="/compare">
              Compare Now
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
