import { useCart } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";

export default function CartSummary() {
  const { items, removeFromCart, updateQuantity, subtotal, shipping, tax, total } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [isOpen, setIsOpen] = useState(false);
  const prevCountRef = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCountRef.current && cartCount > 0) {
      setIsOpen(true);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:text-amber-400 hover:bg-gray-800" data-testid="button-cart-summary">
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center animate-in zoom-in-50 duration-200" data-testid="text-cart-count">
              {cartCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Your Cart ({cartCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-6">Your cart is empty</p>
            <SheetClose asChild>
              <Button asChild variant="outline">
                <Link href="/shop" data-testid="link-browse-shop">Browse Shop</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4 py-4" data-testid="cart-summary-items">
              {items.map((item) => (
                <div key={`${item.id}-${item.variantId || 'base'}`} className="flex gap-3 p-3 rounded-lg border bg-card" data-testid={`cart-item-${item.id}`}>
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromCart(item.id, item.variantId)}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">${parseFloat(String(item.price)).toFixed(2)} each</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1.5 border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-5 text-center" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-sm" data-testid={`text-item-total-${item.id}`}>
                        ${(parseFloat(String(item.price)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2" data-testid="cart-summary-totals">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span data-testid="text-subtotal">${subtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (6.25%)</span>
                <span data-testid="text-tax">${tax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span data-testid="text-shipping">{shipping() === 0 ? 'FREE' : `$${shipping().toFixed(2)}`}</span>
              </div>
              {subtotal() > 0 && subtotal() < 100 && (
                <p className="text-xs text-amber-600">
                  Add ${(100 - subtotal()).toFixed(2)} more for free shipping!
                </p>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span data-testid="text-total">${total().toFixed(2)}</span>
              </div>
            </div>

            <SheetFooter className="flex-col gap-2 sm:flex-col mt-4">
              <SheetClose asChild>
                <Button className="w-full h-11 bg-primary hover:bg-primary/90" asChild>
                  <Link href="/checkout" data-testid="link-checkout">
                    Checkout <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/cart" data-testid="link-view-cart">View Full Cart</Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
