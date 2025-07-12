
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

  // Get SEO-friendly title based on selected genre
  const getGenrePageTitle = () => {
    if (!selectedGenre || !genres.length) return null;
    
    const genre = genres.find(g => g.id === selectedGenre);
    if (!genre) return null;
    
    const genreKeywords = {
      'Action': 'Best Action Movies - Thrilling Adventures & Blockbusters',
      'Adventure': 'Best Adventure Movies - Epic Journeys & Quests',
      'Comedy': 'Best Comedy Movies - Hilarious Films & Funny Movies',
      'Drama': 'Best Drama Movies - Powerful Stories & Emotional Films',
      'Horror': 'Best Horror Movies - Scary Films & Thriller Movies',
      'Romance': 'Best Romance Movies - Love Stories & Romantic Films',
      'Thriller': 'Best Thriller Movies - Suspenseful & Mystery Films',
      'Sci-Fi': 'Best Sci-Fi Movies - Science Fiction & Futuristic Films',
      'Fantasy': 'Best Fantasy Movies - Magical Adventures & Epic Tales',
      'Crime': 'Best Crime Movies - Detective Stories & Criminal Dramas',
      'Mystery': 'Best Mystery Movies - Puzzling Stories & Detective Films',
      'Animation': 'Best Animated Movies - Family Films & Cartoon Adventures',
      'Family': 'Best Family Movies - Kid-Friendly Films & Entertainment',
      'War': 'Best War Movies - Military Films & Historical Battles',
      'Western': 'Best Western Movies - Cowboy Films & Frontier Stories',
      'Music': 'Best Music Movies - Musical Films & Concert Movies',
      'Documentary': 'Best Documentary Movies - Educational & Real Stories',
      'History': 'Best Historical Movies - Period Films & True Stories'
    };
    
    return genreKeywords[genre.name] || `Best ${genre.name} Movies - Top Rated ${genre.name} Films`;
  };

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

    // On page 1 with no filters, show New Releases first, then intersperse other sections
    const sections = [
      { title: "🏆 Greatest Movies (8+ IMDB)", movies: greatestMovies },
      { title: "⭐ Highest Rated Movies (7+ IMDB)", movies: highestRatedMovies },
      { title: "📺 Highest Rated Series (7+ IMDB)", movies: highestRatedSeries }
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

    return elements;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 pt-6">
        {/* Genre Page SEO Title */}
        {selectedGenre && getGenrePageTitle() && (
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {getGenrePageTitle()}
            </h1>
            <p className="text-base text-gray-300 max-w-3xl mx-auto mb-4">
              Discover the finest collection of {genres.find(g => g.id === selectedGenre)?.name.toLowerCase()} movies. 
              Our curated selection features <strong>top-rated {genres.find(g => g.id === selectedGenre)?.name.toLowerCase()} films</strong>, 
              <strong> must-watch {genres.find(g => g.id === selectedGenre)?.name.toLowerCase()} movies</strong>, and 
              <strong> popular {genres.find(g => g.id === selectedGenre)?.name.toLowerCase()} recommendations</strong> 
              with detailed reviews and ratings.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400 mb-4">
              <div>🎬 Top Rated Films</div>
              <div>⭐ Expert Reviews</div>
              <div>🎯 Curated Selection</div>
              <div>📊 Detailed Ratings</div>
            </div>
          </div>
        )}

        {/* SEO Content Section - only show when no search/filter */}
        {showHomeSections && (
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Best Movie Recommendations & Streaming Guide
            </h1>
            <p className="text-base text-gray-300 max-w-3xl mx-auto mb-4">
              Discover <strong>top-rated movies</strong>, explore <strong>action movie recommendations</strong>, 
              find <strong>thriller movies to watch</strong>, and get expert guides for popular genres. 
              Your ultimate destination for <strong>movie recommendations</strong> and <strong>streaming suggestions</strong>.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400 mb-4">
              <div>🎬 Action Movies</div>
              <div>🎭 Drama Films</div>
              <div>😂 Comedy Movies</div>
              <div>👻 Horror Films</div>
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
              Complete Movie Database & Recommendations
            </h2>
            
            <p className="text-gray-300 mb-6">
              Whether you're looking for <strong>best action movies</strong>, <strong>top thriller films</strong>, 
              <strong>comedy movies to watch</strong>, <strong>horror movie recommendations</strong>, or 
              <strong>drama film suggestions</strong> - MovieSuggest is your go-to 
              <strong>movie recommendation platform</strong>. Explore <strong>genre-based movie lists</strong>, discover <strong>hidden gems</strong>, 
              find <strong>streaming recommendations</strong>, and get <strong>expert movie reviews</strong>.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
              <div>
                <h3 className="text-white font-semibold mb-3">Popular Movie Genres</h3>
                <ul className="space-y-2">
                  <li><strong>Action Movies</strong> - Explosive blockbusters and adventure films</li>
                  <li><strong>Thriller Movies</strong> - Suspenseful and mystery films</li>
                  <li><strong>Comedy Movies</strong> - Hilarious and entertaining films</li>
                  <li><strong>Horror Movies</strong> - Scary and supernatural films</li>
                  <li><strong>Drama Movies</strong> - Emotional and powerful storytelling</li>
                  <li><strong>Romance Movies</strong> - Love stories and romantic comedies</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Movie Recommendations</h3>
                <ul className="space-y-2">
                  <li><strong>Top Rated Movies</strong> - Highest rated films of all time</li>
                  <li><strong>Must Watch Movies</strong> - Essential cinema experiences</li>
                  <li><strong>Hidden Gem Movies</strong> - Underrated and overlooked films</li>
                  <li><strong>New Movie Releases</strong> - Latest films and upcoming movies</li>
                  <li><strong>Classic Movies</strong> - Timeless cinema masterpieces</li>
                  <li><strong>International Films</strong> - World cinema and foreign films</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Streaming & Reviews</h3>
                <ul className="space-y-2">
                  <li><strong>Streaming Guide</strong> - Where to watch your favorite movies</li>
                  <li><strong>Movie Reviews</strong> - Expert analysis and ratings</li>
                  <li><strong>What to Watch</strong> - Personalized recommendations</li>
                  <li><strong>Movie Lists</strong> - Curated collections by theme</li>
                  <li><strong>Film Ratings</strong> - TM ratings and user scores</li>
                  <li><strong>Movie News</strong> - Latest updates and releases</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-500">
                <strong>Popular Search Terms:</strong> what to watch tonight, movie recommendations, 
                best movies to watch, streaming movie suggestions, top rated films, movie reviews, 
                action movie list, thriller movies, comedy films, horror movies, drama movies
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
