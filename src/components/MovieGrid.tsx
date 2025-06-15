
import MovieCard from '@/components/MovieCard';
import { Loader2 } from 'lucide-react';

interface MovieGridProps {
  movies: any[];
  isLoading: boolean;
}

const MovieGrid = ({ movies, isLoading }: MovieGridProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white text-lg">No movies found</p>
        <p className="text-gray-400 mt-2">Try adjusting your search or genre filter</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8">
      {movies.map((movie, index) => (
        <MovieCard
          key={`${movie.id}-${index}`}
          movie={movie}
        />
      ))}
    </div>
  );
};

export default MovieGrid;
