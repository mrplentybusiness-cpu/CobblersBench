import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import type { CobblerLifeVideo, SiteContent } from "@shared/schema";
import { VIDEO_CATEGORIES } from "@shared/schema";
import { Loader2, Play, X, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [playingVideo, setPlayingVideo] = useState<CobblerLifeVideo | null>(null);

  const { data: videos = [], isLoading } = useQuery<CobblerLifeVideo[]>({
    queryKey: ['/api/videos/published'],
    queryFn: async () => {
      const response = await fetch('/api/videos/published');
      if (!response.ok) throw new Error('Failed to fetch videos');
      return response.json();
    },
  });

  const { data: galleryContent } = useQuery<SiteContent | null>({
    queryKey: ['/api/site-content/cobbler-life'],
    queryFn: async () => {
      const response = await fetch('/api/site-content/cobbler-life');
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    },
  });

  const title = galleryContent?.title || "Cobbler's Life";
  const description = galleryContent?.content || "Step into the workshop and watch the craft come alive. POV footage of sole repairs, restorations, deep cleans, and more.";

  const categories = ["All", ...VIDEO_CATEGORIES];
  const filteredVideos = selectedCategory === "All" 
    ? videos 
    : videos.filter(v => v.category === selectedCategory);

  return (
    <Layout>
      <div className="bg-gradient-to-b from-stone-900 to-stone-800 py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Film className="h-8 w-8 text-amber-400" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white" data-testid="gallery-title">
              {title}
            </h1>
          </div>
          <p className="text-lg text-stone-300 max-w-2xl" data-testid="gallery-description">
            {description}
          </p>
        </div>
      </div>

      <div className="bg-stone-50 border-b sticky top-20 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar" data-testid="category-filter">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className={selectedCategory === cat 
                  ? "bg-amber-600 hover:bg-amber-700 text-white shrink-0" 
                  : "shrink-0 border-stone-300"}
                onClick={() => setSelectedCategory(cat)}
                data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20" data-testid="gallery-empty">
            <Film className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
              {selectedCategory === "All" ? "Videos Coming Soon" : `No ${selectedCategory} Videos Yet`}
            </h2>
            <p className="text-muted-foreground">
              Check back soon for behind-the-scenes workshop footage.
            </p>
          </div>
        ) : (
          <>
            <p className="text-center text-muted-foreground mb-8">
              {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="video-grid">
              {filteredVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onPlay={() => setPlayingVideo(video)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {playingVideo && (
        <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </Layout>
  );
}

function VideoCard({ video, onPlay }: { video: CobblerLifeVideo; onPlay: () => void }) {
  return (
    <div 
      className="group relative cursor-pointer rounded-xl overflow-hidden bg-black shadow-lg hover:shadow-xl transition-all"
      onClick={onPlay}
      data-testid={`video-card-${video.id}`}
    >
      <div className="aspect-[9/16] relative">
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center">
            <Film className="h-12 w-12 text-stone-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Play className="h-7 w-7 text-stone-900 ml-1" fill="currentColor" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <Badge className="bg-amber-600/90 text-white text-[10px] mb-1">{video.category}</Badge>
          <h3 className="text-white text-sm font-semibold leading-tight line-clamp-2">{video.title}</h3>
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ video, onClose }: { video: CobblerLifeVideo; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === containerRef.current) onClose(); }}
      data-testid="video-player-overlay"
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        data-testid="close-video"
      >
        <X className="h-6 w-6 text-white" />
      </button>
      
      <div className="relative w-full max-w-sm mx-auto" style={{ maxHeight: '90vh' }}>
        <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl">
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            data-testid="video-element"
          />
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-white text-lg font-semibold">{video.title}</h3>
          {video.description && (
            <p className="text-stone-400 text-sm mt-1">{video.description}</p>
          )}
          <Badge className="bg-amber-600/80 text-white mt-2">{video.category}</Badge>
        </div>
      </div>
    </div>
  );
}
