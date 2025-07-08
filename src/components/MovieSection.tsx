
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { Button } from './ui/button';

interface MovieSectionProps {
  title: string;
  movies: any[];
  isLoading?: boolean;
}

const MovieSection = ({ title, movies, isLoading }: MovieSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 240; // Reduced scroll amount for smaller cards
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="flex gap-2 md:gap-3 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-28 md:w-32 h-40 md:h-48 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="bg-gray-800/50 border-gray-600 hover:bg-gray-700 h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="bg-gray-800/50 border-gray-600 hover:bg-gray-700 h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie, index) => (
          <div key={`${movie.id}-${index}`} className="flex-shrink-0 w-28 md:w-32">
            <MovieCard movie={movie} isCompact={true} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieSection;
