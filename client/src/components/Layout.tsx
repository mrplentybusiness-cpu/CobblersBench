import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/store";
import { ShoppingBag, Menu, Hammer, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@assets/Cobbler's_Bench_Logo_1767715154008.png";
import CompareTray from "@/components/CompareTray";
import { useQuery } from "@tanstack/react-query";
import type { SiteContent } from "@shared/schema";

interface LayoutProps {
  children: React.ReactNode;
  hideCompareTray?: boolean;
}

export default function Layout({ children, hideCompareTray = false }: LayoutProps) {
  const [location] = useLocation();
  const cartItems = useCart((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: businessInfo } = useQuery<SiteContent | null>({
    queryKey: ["/api/site-content/business-info"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/business-info");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: layoutContent } = useQuery<SiteContent | null>({
    queryKey: ["/api/site-content/layout"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/layout");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: brandingContent } = useQuery<SiteContent | null>({
    queryKey: ["/api/site-content/branding"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/branding");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const tagline = layoutContent?.title || '"We doctor your shoes and save your sole."';
  const footerAbout = layoutContent?.content || "Restoring your favorite footsteps since 1985. We combine traditional craftsmanship with modern care to bring your leather goods back to life.";
  const headerLogo = brandingContent?.imageUrl || logo;

  const streetAddress = businessInfo?.title || "1600 Falmouth Rd";
  const cityStateZip = businessInfo?.content || "Centerville, MA 02632";
  const phone = businessInfo?.imageUrl || "+1 (508) 775-6221";
  const hours = businessInfo?.imageUrls || ["Mon - Fri: 8:00 AM – 4:00 PM", "Sat: 8:00 AM – 12:00 PM", "Sun: Closed"];

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className={`text-sm font-semibold uppercase tracking-wide transition-colors hover:text-amber-400 ${location === href ? "text-amber-400" : "text-white"}`}>
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-16 w-auto overflow-hidden">
              <img 
                src={headerLogo} 
                alt="Cobbler's Bench" 
                className="h-full w-auto object-contain"
              />
            </div>
          </Link>
          <span className="hidden lg:block text-sm italic text-amber-300/90 ml-4">{tagline}</span>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/services">Our Services</NavLink>
            <NavLink href="/plantar-fasciitis">Knowledge</NavLink>
            <NavLink href="/shop">Shop</NavLink>
            <NavLink href="/gallery">Cobbler's Life</NavLink>
            <NavLink href="/reviews">Reviews</NavLink>
            <NavLink href="/about">About</NavLink>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-amber-400 hover:bg-gray-800" asChild data-testid="link-admin-desktop">
              <Link href="/admin">
                <Lock className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="relative text-white hover:text-amber-400 hover:bg-gray-800" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-gray-800" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
            
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
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
                  <Link href="/gallery" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    Cobbler's Life
                  </Link>
                  <Link href="/reviews" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    Reviews
                  </Link>
                  <Link href="/about" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    About
                  </Link>
                  <Link href="/cart" className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>
                    Cart ({cartCount})
                  </Link>
                  <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground mt-4" onClick={() => setIsMobileOpen(false)} data-testid="link-admin-mobile">
                    <Lock className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20">
        {children}
      </main>
      
      {!hideCompareTray && <CompareTray />}

      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Hammer className="h-5 w-5" /> Cobbler's Bench
            </h3>
            <p className="text-primary-foreground/80 text-sm max-w-xs">
              {footerAbout}
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Visit Us</h4>
            <p className="text-sm text-primary-foreground/80" data-testid="footer-address">
              {streetAddress}<br />
              {cityStateZip}<br />
              {phone}
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Hours</h4>
            <p className="text-sm text-primary-foreground/80" data-testid="footer-hours">
              {hours.map((line, i) => (
                <span key={i}>{line}{i < hours.length - 1 && <br />}</span>
              ))}
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center text-xs text-primary-foreground/60">
          <span>© {new Date().getFullYear()} Cobbler's Bench. All rights reserved.</span>
          <Link href="/admin" className="hover:text-primary-foreground transition-colors mt-2 md:mt-0 flex items-center gap-1" data-testid="link-admin-footer">
            <Lock className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="container mx-auto px-4 mt-4 text-center text-xs text-primary-foreground/50">
          <span>Built by </span>
          <a href="https://www.PlentyWebDesign.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-foreground/80 transition-colors">
            Plenty Web Design
          </a>
        </div>
      </footer>
    </div>
  );
}
