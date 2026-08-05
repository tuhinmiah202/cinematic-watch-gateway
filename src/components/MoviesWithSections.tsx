
import MovieCard from './MovieCard';
import MovieSection from './MovieSection';
import { Skeleton } from './ui/skeleton';

interface MoviesWithSectionsProps {
  currentMovies: any[];
  showHomeSections: boolean;
  newReleases: any[];
  greatestMovies: any[];
  highestRatedMovies: any[];
  highestRatedSeries: any[];
  isLoadingSections: boolean;
}

const MoviesWithSections = ({
  currentMovies,
  showHomeSections,
  newReleases,
  greatestMovies,
  highestRatedMovies,
  highestRatedSeries,
  isLoadingSections
}: MoviesWithSectionsProps) => {
  if (!showHomeSections) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 mb-12">
        {currentMovies.map((movie, index) => (
          <MovieCard
            key={`${movie.id}-${index}`}
            movie={movie}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <MovieSection
        title="🆕 New Releases"
        movies={newReleases}
        isLoading={isLoadingSections}
      />

      <MovieSection
        title="🏆 Greatest Movies"
        movies={greatestMovies}
        isLoading={isLoadingSections}
      />

      <MovieSection
        title="📺 Top Series"
        movies={highestRatedSeries}
        isLoading={isLoadingSections}
      />

      <div className="pt-8">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
            Explore Popular
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 mb-12">
            {currentMovies.slice(0, 18).map((movie, index) => (
            <MovieCard
                key={`${movie.id}-${index}`}
                movie={movie}
            />
            ))}
        </div>
      </div>

      <MovieSection
        title="⭐ Highest Rated"
        movies={highestRatedMovies}
        isLoading={isLoadingSections}
      />
    </div>
  );
};

export default MoviesWithSections;
