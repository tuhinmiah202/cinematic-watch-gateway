
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

const SECTION_INTERVAL = 6;

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
    if (currentMovies.length === 0 && isLoadingSections) {
      return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-6">
          {[...Array(18)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-6">
        {currentMovies.map((movie, index) => (
          <MovieCard
            key={`${movie.id}-${index}`}
            movie={movie}
          />
        ))}
      </div>
    );
  }

  const sections = [
    { title: "🏆 Greatest Movies (8+ TM Rating)", movies: greatestMovies },
    { title: "⭐ Highest Rated Movies (7+ TM Rating)", movies: highestRatedMovies },
    { title: "📺 Highest Rated Series (7+ TM Rating)", movies: highestRatedSeries }
  ];

  const elements = [];
  let sectionIndex = 0;
  
  // Add New Releases section at the top
  elements.push(
    <div key="new-releases" className="mb-8">
      <MovieSection
        title="🆕 New Releases"
        movies={newReleases}
        isLoading={isLoadingSections}
      />
    </div>
  );
  
  for (let i = 0; i < currentMovies.length; i += SECTION_INTERVAL) {
    // Add movies grid
    const moviesSlice = currentMovies.slice(i, i + SECTION_INTERVAL);
    if (moviesSlice.length > 0) {
      elements.push(
        <div key={`movies-${i}`} className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8">
          {moviesSlice.map((movie, index) => (
            <MovieCard
              key={`${movie.id}-${i + index}`}
              movie={movie}
            />
          ))}
        </div>
      );
    }

    // Add section after movies (if there are more sections to show)
    if (sectionIndex < sections.length) {
      const section = sections[sectionIndex];
      elements.push(
        <div key={`section-${sectionIndex}`} className="mb-8">
          <MovieSection
            title={section.title}
            movies={section.movies}
            isLoading={isLoadingSections}
          />
        </div>
      );
      sectionIndex++;
    }
  }

  return <>{elements}</>;
};

export default MoviesWithSections;
