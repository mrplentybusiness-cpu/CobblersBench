import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Hammer, MapPin, Clock, Phone } from "lucide-react";

interface SiteContent {
  id: number;
  key: string;
  value: Record<string, string>;
  updatedAt: string;
}

export default function About() {
  const { data: aboutContent } = useQuery<SiteContent>({
    queryKey: ["/api/site-content/about-us"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/about-us");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const title = aboutContent?.value?.title || "Our Story";
  const content = aboutContent?.value?.content || "For over 35 years, Cobbler's Bench has been Cape Cod's trusted destination for expert shoe repair and leather restoration. Our skilled craftsmen combine time-honored techniques with modern expertise to breathe new life into your favorite footwear and leather goods.";
  const imageUrl = aboutContent?.value?.imageUrl || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800";

  return (
    <Layout>
      <div className="min-h-screen bg-stone-50">
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={imageUrl}
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

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <MapPin className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Location</h3>
                <p className="text-gray-600 text-sm">
                  1600 Falmouth Rd<br />
                  Centerville, MA 02632
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Clock className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Hours</h3>
                <p className="text-gray-600 text-sm">
                  Mon - Fri: 8AM – 4PM<br />
                  Sat: 8AM – 12PM<br />
                  Sun: Closed
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Phone className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Contact</h3>
                <p className="text-gray-600 text-sm">
                  (508) 775-6221<br />
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
