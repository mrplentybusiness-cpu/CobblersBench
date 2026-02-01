import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Hammer, MapPin, Clock, Phone } from "lucide-react";
import type { SiteContent } from "@shared/schema";

export default function About() {
  const { data: aboutContent } = useQuery<SiteContent | null>({
    queryKey: ["/api/site-content/about-us"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/about-us");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: businessInfo } = useQuery<SiteContent | null>({
    queryKey: ["/api/site-content/business-info"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/business-info");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const title = aboutContent?.title || "Our Story";
  const content = aboutContent?.content || "For over 35 years, Cobbler's Bench has been Cape Cod's trusted destination for expert shoe repair and leather restoration. Our skilled craftsmen combine time-honored techniques with modern expertise to breathe new life into your favorite footwear and leather goods.";
  const heroImage = aboutContent?.imageUrl || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800";
  const galleryImages = aboutContent?.imageUrls || [];

  const streetAddress = businessInfo?.title || "1600 Falmouth Rd";
  const cityStateZip = businessInfo?.content || "Centerville, MA 02632";
  const phone = businessInfo?.imageUrl || "(508) 775-6221";
  const hours = businessInfo?.imageUrls || ["Mon - Fri: 8AM – 4PM", "Sat: 8AM – 12PM", "Sun: Closed"];

  return (
    <Layout>
      <div className="min-h-screen bg-stone-50">
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={heroImage}
            alt="About Cobbler's Bench"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white" data-testid="text-about-title">
              {title}
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Hammer className="h-8 w-8 text-amber-600" />
                <h2 className="text-2xl font-serif font-bold text-gray-900">About Us</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700" data-testid="text-about-content">
                {content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>

            {galleryImages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-6">Our Workshop</h3>
                {/* Asymmetrical Editorial Grid - Desktop */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:auto-rows-[200px]">
                  {galleryImages.slice(0, 5).map((url, index) => {
                    const gridStyles = [
                      "col-span-7 row-span-2",
                      "col-span-5 row-span-1",
                      "col-span-5 row-span-1",
                      "col-span-6 row-span-1",
                      "col-span-6 row-span-1",
                    ];
                    return (
                      <div 
                        key={index} 
                        className={`${gridStyles[index] || 'col-span-4 row-span-1'} rounded-lg overflow-hidden shadow-md group`}
                      >
                        <img
                          src={url}
                          alt={`Workshop image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          data-testid={`about-gallery-image-${index}`}
                        />
                      </div>
                    );
                  })}
                  {galleryImages.length > 5 && galleryImages.slice(5).map((url, index) => (
                    <div 
                      key={index + 5} 
                      className="col-span-4 row-span-1 rounded-lg overflow-hidden shadow-md group"
                    >
                      <img
                        src={url}
                        alt={`Workshop image ${index + 6}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        data-testid={`about-gallery-image-${index + 5}`}
                      />
                    </div>
                  ))}
                </div>
                {/* Mobile Lookbook Stack */}
                <div className="md:hidden space-y-4">
                  {galleryImages.map((url, index) => (
                    <div key={index} className="aspect-[4/3] rounded-lg overflow-hidden shadow-md">
                      <img
                        src={url}
                        alt={`Workshop image ${index + 1}`}
                        className="w-full h-full object-cover"
                        data-testid={`about-gallery-image-mobile-${index}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <MapPin className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Location</h3>
                <p className="text-gray-600 text-sm" data-testid="text-about-address">
                  {streetAddress}<br />
                  {cityStateZip}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Clock className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Hours</h3>
                <p className="text-gray-600 text-sm" data-testid="text-about-hours">
                  {hours.map((line, i) => (
                    <span key={i}>{line}{i < hours.length - 1 && <br />}</span>
                  ))}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Phone className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Contact</h3>
                <p className="text-gray-600 text-sm" data-testid="text-about-phone">
                  {phone}<br />
                  <span className="text-amber-600">Walk-ins Welcome</span>
                </p>
              </div>
            </div>

            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <p className="text-amber-800 font-medium italic text-lg">
                "We doctor your shoes and save your sole."
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
