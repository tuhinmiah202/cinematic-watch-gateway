import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { useDebounce } from '@/hooks/useDebounce';
import { useMovieData } from '@/hooks/useMovieData';
import { useHomeSections } from '@/hooks/useHomeSections';
import { autoDiscoveryService } from '@/services/autoDiscoveryService';
import FilterControls from '@/components/FilterControls';
import MovieCard from '@/components/MovieCard';
import MovieSection from '@/components/MovieSection';
import HomePagination from '@/components/HomePagination';

const ITEMS_PER_PAGE = 24;
const SECTION_INTERVAL = 9; // Show sections after every 9 movies

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contentType, setContentType] = useState('all');

  const { genres, allMovies, isLoading } = useMovieData(selectedGenre, debouncedSearchTerm, contentType);
  const {
    newReleases,
    greatestMovies,
    highestRatedMovies,
    highestRatedSeries,
    isLoading: isLoadingSections
  } = useHomeSections();

  // Run auto-discovery on component mount (only on first page)
  useEffect(() => {
    if (currentPage === 1 && !debouncedSearchTerm && !selectedGenre && contentType === 'all') {
      // Run auto-discovery once per session
      const lastDiscovery = localStorage.getItem('lastAutoDiscovery');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (!lastDiscovery || now - parseInt(lastDiscovery) > oneHour) {
        autoDiscoveryService.runAutoDiscovery().then(() => {
          localStorage.setItem('lastAutoDiscovery', now.toString());
        });
      }
    }
  }, [currentPage, debouncedSearchTerm, selectedGenre, contentType]);

  // Show sections only when there's no search or filter applied AND we're on page 1
  const showHomeSections = !debouncedSearchTerm && !selectedGenre && contentType === 'all' && currentPage === 1;

  // Get movies for current page
  const paginatedMovies = useCallback(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allMovies.slice(startIndex, endIndex);
  }, [allMovies, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(allMovies.length / ITEMS_PER_PAGE);

  // Handle search from navbar or filter controls
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle genre change
  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
  };

  // Reset page when search term or genre changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedGenre, contentType]);

  const currentMovies = paginatedMovies();

  // Function to render movies with interspersed sections
  const renderMoviesWithSections = () => {
    if (!showHomeSections) {
      // If not on page 1 or filtering, just show regular grid
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

    // On page 1 with no filters, intersperse sections
    const sections = [
      { title: "🆕 New Releases", movies: newReleases },
      { title: "🏆 Greatest Movies (8+ IMDB)", movies: greatestMovies },
      { title: "⭐ Highest Rated Movies (7+ IMDB)", movies: highestRatedMovies },
      { title: "📺 Highest Rated Series (7+ IMDB)", movies: highestRatedSeries }
    ];

    const elements = [];
    let sectionIndex = 0;
    
    for (let i = 0; i < currentMovies.length; i += SECTION_INTERVAL) {
      // Add section before movies (but not at the very beginning)
      if (i > 0 && sectionIndex < sections.length) {
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
    }

    // Add remaining sections if any
    while (sectionIndex < sections.length) {
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

    return elements;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 pt-6">
        {/* SEO Content Section - only show when no search/filter */}
        {showHomeSections && (
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Best Movie Recommendations & Streaming Guide
            </h1>
            <p className="text-base text-gray-300 max-w-3xl mx-auto mb-4">
              Discover <strong>top-rated movies</strong>, explore the complete <strong>Marvel movie list</strong>, 
              find <strong>anime series to watch</strong>, and get expert guides for popular franchises. 
              Your ultimate destination for <strong>movie recommendations</strong> and <strong>streaming suggestions</strong>.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400 mb-4">
              <div>🎬 Marvel Universe</div>
              <div>⚡ X-Men Timeline</div>
              <div>🌟 Top Anime</div>
              <div>🌌 Sci-Fi Movies</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="container mx-auto px-4 py-4 min-h-screen">
        <FilterControls
          genres={genres}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onGenreChange={handleGenreChange}
          contentType={contentType}
          onContentTypeChange={setContentType}
        />

        {/* Movies and Sections - interspersed layout */}
        {renderMoviesWithSections()}

        {/* Show loading or no movies message if needed */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent"></div>
          </div>
        )}

        {!isLoading && currentMovies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white text-lg">No movies found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or genre filter</p>
          </div>
        )}

        <HomePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
          totalItems={allMovies.length}
        />

        {/* Detailed SEO Footer Content */}
        <div className="mt-12 text-center pb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              Complete Movie & Series Database
            </h2>
            
            <p className="text-gray-300 mb-6">
              Whether you're looking for <strong>Marvel movies ranked</strong>, the complete <strong>anime must-watch list</strong>, 
              <strong>X-Men timeline explained</strong>, <strong>Harry Potter watch order</strong>, <strong>Twilight saga guide</strong>, 
             <strong>Fast and Furious all movies</strong>, or <strong>Star Wars explained</strong> - CineStream is your go-to 
             <strong>movie recommendation AI</strong>. Explore <strong>superhero movie guides</strong>, discover <strong>underrated anime gems</strong>, 
              find <strong>best Netflix series</strong>, and get <strong>Disney Plus movies list</strong> recommendations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
              <div>
                <h3 className="text-white font-semibold mb-3">Popular Movie Franchises</h3>
                <ul className="space-y-2">
                  <li><strong>Marvel Cinematic Universe</strong> - Complete MCU timeline and phases explained</li>
                  <li><strong>X-Men Movies Ranked</strong> - X-Men timeline and character guide</li>
                  <li><strong>Harry Potter Complete Series</strong> - Movies ranked and Fantastic Beasts explained</li>
                  <li><strong>Star Wars Watch Guide</strong> - All movies and series in chronological order</li>
                  <li><strong>Fast and Furious Timeline</strong> - Complete franchise guide</li>
                  <li><strong>Twilight Saga Watch Order</strong> - Love story movies like Twilight</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Anime & Series Recommendations</h3>
                <ul className="space-y-2">
                  <li><strong>Top Anime Recommendations</strong> - Best anime of all time</li>
                  <li><strong>Anime Must Watch List</strong> - Anime for beginners and experts</li>
                  <li><strong>Romantic Anime Series</strong> - Best love story anime</li>
                  <li><strong>Dark Fantasy Anime</strong> - Underrated anime gems</li>
                  <li><strong>Best Netflix Series</strong> - Top streaming recommendations</li>
                  <li><strong>Binge-Worthy Movies</strong> - Complete watchlist creator</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Movie Categories & Reviews</h3>
                <ul className="space-y-2">
                  <li><strong>Best Sci-Fi Movies</strong> - Epic sci-fi series and films</li>
                  <li><strong>Fantasy Movies to Watch</strong> - Magical movie adventures</li>
                  <li><strong>Action Movie Recommendations</strong> - Top action films ranked</li>
                  <li><strong>Superhero Movies Ranked</strong> - DC vs Marvel movies</li>
                  <li><strong>Movie Rating and Reviews</strong> - Unique reviews by genre</li>
                  <li><strong>Latest Movie Releases</strong> - Best movies 2025 and upcoming</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-500">
                <strong>Popular Search Terms:</strong> what to watch tonight, movie lovers site, streaming movie suggestions, 
                find movies to watch, movie recommendation engine, film recommendation site, discover new movies, 
                watch next suggestions, movie trivia and facts, fan favorite movie lists, movie lovers community
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
