import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/store";
import { ShoppingBag, Menu, Hammer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@assets/Transparent_Cobbler's_Bench_Logo_1767042558581.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const cartItems = useCart((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className={`text-sm font-medium transition-colors hover:text-primary ${location === href ? "text-primary font-bold" : "text-muted-foreground"}`}>
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-12 w-12 overflow-hidden rounded-md">
              <img 
                src={logo} 
                alt="Cobbler's Bench" 
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold leading-none text-foreground group-hover:text-primary transition-colors">Cobbler's Bench</span>
              <span className="text-xs text-muted-foreground tracking-widest uppercase">Shoe & Leather Repair</span>
            </div>
          </Link>
          <span className="hidden lg:block text-sm italic text-foreground ml-4">"We doctor your shoes and save your sole."</span>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/services">Our Services</NavLink>
            <NavLink href="/plantar-fasciitis">Knowledge</NavLink>
            <NavLink href="/shop">Shop</NavLink>
            <NavLink href="/admin">Admin</NavLink>
            {/* <NavLink href="/about">Our Story</NavLink> */}
            <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-foreground" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
            
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 mt-10">
                  <Link href="/" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    Home
                  </Link>
                  <Link href="/services" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    Our Services
                  </Link>
                  <Link href="/plantar-fasciitis" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    Knowledge
                  </Link>
                  <Link href="/shop" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    Shop
                  </Link>
                  <Link href="/cart" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    Cart ({cartCount})
                  </Link>
                  <Link href="/admin" className="text-sm text-muted-foreground mt-4" onClick={() => setIsMobileOpen(false)}>
                     Admin Login
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Hammer className="h-5 w-5" /> Cobbler's Bench
            </h3>
            <p className="text-primary-foreground/80 text-sm max-w-xs">
              Restoring your favorite footsteps since 1985. We combine traditional craftsmanship with modern care to bring your leather goods back to life.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Visit Us</h4>
            <p className="text-sm text-primary-foreground/80">
              1600 Falmouth Rd<br />
              Centerville, MA 02632<br />
              +1 (508) 775-6221
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Hours</h4>
            <p className="text-sm text-primary-foreground/80">
              Mon - Fri: 8:00 AM – 4:00 PM<br />
              Sat: 8:00 AM – 12:00 PM<br />
              Sun: Closed
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center text-xs text-primary-foreground/60">
          <span>© {new Date().getFullYear()} Cobbler's Bench. All rights reserved.</span>
          <Link href="/admin" className="hover:text-primary-foreground transition-colors mt-2 md:mt-0">Admin Login</Link>
        </div>
      </footer>
    </div>
  );
}
