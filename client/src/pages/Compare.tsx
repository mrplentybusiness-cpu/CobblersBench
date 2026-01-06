import Layout from "@/components/Layout";
import { useCompare, useCart } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, ShoppingBag, X, ImageOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

export default function Compare() {
  const { productIds, removeFromCompare, clearCompare } = useCompare();
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();

  const { data: allProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/active'],
    enabled: productIds.length > 0,
  });

  const items = allProducts.filter(p => productIds.includes(p.id));

  useEffect(() => {
    if (!isLoading && allProducts.length > 0) {
      const validIds = allProducts.map(p => p.id);
      const invalidIds = productIds.filter(id => !validIds.includes(id));
      invalidIds.forEach(id => removeFromCompare(id));
    }
  }, [allProducts, isLoading, productIds, removeFromCompare]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (productIds.length === 0) {
    return (
      <Layout hideCompareTray>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Compare Products</h1>
          <p className="text-muted-foreground mb-8">
            You haven't selected any products to compare yet. Browse our shop and click the compare icon on products you'd like to compare.
          </p>
          <Button asChild>
            <Link href="/shop">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Shop
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout hideCompareTray>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideCompareTray>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold">Compare Products</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Comparing {items.length} product{items.length > 1 ? 's' : ''} side by side
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearCompare} data-testid="button-clear-all">
              Clear All
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/shop">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to</span> Shop
              </Link>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" data-testid="compare-table">
            <thead>
              <tr>
                <th className="text-left p-3 md:p-4 border-b bg-muted/50 font-medium min-w-[80px] md:min-w-[120px] text-sm">Feature</th>
                {items.map((product) => (
                  <th key={product.id} className="p-3 md:p-4 border-b bg-muted/50 min-w-[150px] md:min-w-[200px]">
                    <ProductHeader product={product} onRemove={() => removeFromCompare(product.id)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 md:p-4 border-b font-medium text-muted-foreground text-sm">Price</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 border-b text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg md:text-xl font-bold text-primary" data-testid={`compare-price-${product.id}`}>
                        ${product.price}
                      </span>
                      {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                        <span className="text-xs md:text-sm text-muted-foreground line-through">
                          ${product.compareAtPrice}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 md:p-4 border-b font-medium text-muted-foreground text-sm">Category</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 border-b text-center capitalize text-sm" data-testid={`compare-category-${product.id}`}>
                    {product.category || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 md:p-4 border-b font-medium text-muted-foreground text-sm">Type</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 border-b text-center text-sm" data-testid={`compare-type-${product.id}`}>
                    {product.productType || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 md:p-4 border-b font-medium text-muted-foreground text-sm">Brand</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 border-b text-center text-sm" data-testid={`compare-brand-${product.id}`}>
                    {product.brand || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 md:p-4 border-b font-medium text-muted-foreground text-sm">Color</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 border-b text-center text-sm" data-testid={`compare-color-${product.id}`}>
                    {product.color || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 md:p-4 border-b font-medium text-muted-foreground text-sm">SKU</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 border-b text-center font-mono text-xs md:text-sm" data-testid={`compare-sku-${product.id}`}>
                    {product.sku || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 md:p-4 border-b font-medium text-muted-foreground text-sm">Stock</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 border-b text-center text-sm" data-testid={`compare-availability-${product.id}`}>
                    {product.trackInventory ? (
                      product.inventory === 0 ? (
                        <span className="text-destructive font-medium">Out of Stock</span>
                      ) : product.inventory && product.inventory <= 5 ? (
                        <span className="text-amber-600 font-medium">Only {product.inventory} left</span>
                      ) : (
                        <span className="text-green-600 font-medium">In Stock</span>
                      )
                    ) : (
                      <span className="text-green-600 font-medium">In Stock</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 md:p-4 border-b font-medium text-muted-foreground align-top text-sm">Details</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 border-b text-xs md:text-sm text-muted-foreground" data-testid={`compare-description-${product.id}`}>
                    {product.description || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 md:p-4 font-medium text-muted-foreground text-sm">Action</td>
                {items.map((product) => (
                  <td key={product.id} className="p-3 md:p-4 text-center">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={Boolean(product.trackInventory && product.inventory === 0)}
                      className="w-full"
                      data-testid={`compare-add-to-cart-${product.id}`}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Add to Order
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function ProductHeader({ product, onRemove }: { product: Product; onRemove: () => void }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="flex flex-col items-center gap-3 relative">
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
        data-testid={`button-remove-${product.id}`}
      >
        <X className="h-3 w-3" />
      </button>
      <div className="w-24 h-24 rounded-lg overflow-hidden border bg-muted">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        ) : (
          <img
            src={product.imageUrl || ''}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <Link href={`/product/${product.id}`} className="font-semibold hover:text-primary text-center">
        {product.name}
      </Link>
    </div>
  );
}
