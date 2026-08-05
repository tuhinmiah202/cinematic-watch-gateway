
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { tmdbService } from '@/services/tmdbService';

interface TrendingHeroProps {
  items: any[];
  isLoading: boolean;
}

const TrendingHero = ({ items, isLoading }: TrendingHeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 5));
    }, 8000);

    return () => clearInterval(interval);
  }, [items]);

  if (isLoading || items.length === 0) {
    return (
      <div className="w-full h-[50vh] md:h-[70vh] bg-gray-900 animate-pulse rounded-2xl overflow-hidden mb-8" />
    );
  }

  const currentItem = items[currentIndex];
  const title = currentItem.title || currentItem.name;
  const backdropUrl = tmdbService.getBackdropUrl(currentItem.backdrop_path);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.min(items.length, 5)) % Math.min(items.length, 5));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 5));
  };

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] rounded-3xl overflow-hidden mb-12 group">
      {/* Background Image */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out scale-105"
        style={{
          backgroundImage: `url(${backdropUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradients for modern look */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-20">
        <div className="max-w-3xl space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              Trending {currentItem.media_type === 'tv' ? 'Series' : 'Movie'}
            </span>
            <span className="text-gray-300 text-sm font-medium">
              ★ {currentItem.vote_average?.toFixed(1)} Rating
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight drop-shadow-2xl">
            {title}
          </h1>

          <p className="text-gray-300 text-sm md:text-lg line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-lg font-light leading-relaxed">
            {currentItem.overview}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-bold rounded-xl flex items-center gap-2 transition-transform hover:scale-105"
              onClick={() => navigate(`/watch/${currentItem.id}`)}
            >
              <Play className="fill-black w-5 h-5" />
              Watch Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 px-8 py-6 text-lg font-bold rounded-xl flex items-center gap-2 transition-transform hover:scale-105"
              onClick={() => navigate(`/movie/${currentItem.id}`)}
            >
              <Info className="w-5 h-5" />
              More Info
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/50 hover:text-white hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/50 hover:text-white hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 right-12 flex gap-2">
        {[...Array(Math.min(items.length, 5))].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-purple-500' : 'w-2 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TrendingHero;
