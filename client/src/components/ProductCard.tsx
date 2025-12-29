import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md flex flex-col h-full" data-testid={`product-card-${product.id}`}>
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          data-testid={`product-image-${product.id}`}
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-lg font-semibold leading-tight" data-testid={`product-name-${product.id}`}>{product.name}</h3>
          <span className="font-bold text-primary ml-2" data-testid={`product-price-${product.id}`}>${product.price}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1" data-testid={`product-description-${product.id}`}>{product.description}</p>
        <Button 
          onClick={handleAddToCart} 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          data-testid={`button-add-to-cart-${product.id}`}
        >
          Add to Order
        </Button>
      </div>
    </div>
  );
}
