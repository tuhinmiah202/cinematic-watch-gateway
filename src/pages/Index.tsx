
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AdsterraBanner from '@/components/AdsterraBanner';
import NativeBanner from '@/components/NativeBanner';
import { useDebounce } from '@/hooks/useDebounce';
import { useMovieData } from '@/hooks/useMovieData';
import FilterControls from '@/components/FilterControls';
import MovieCard from '@/components/MovieCard';
import HomePagination from '@/components/HomePagination';

const ITEMS_PER_PAGE = 24;

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contentType, setContentType] = useState('all');

  const { genres, allMovies, isLoading } = useMovieData(selectedGenre, debouncedSearchTerm, contentType);

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

  // Split movies for ad placement - show ads after every 9 movies
  const currentMovies = paginatedMovies();
  const moviesWithAds = [];
  
  for (let i = 0; i < currentMovies.length; i += 9) {
    const chunk = currentMovies.slice(i, i + 9);
    moviesWithAds.push({ type: 'movies', data: chunk });
    
    // Add ad after every 9 movies (except the last chunk if it's less than 9)
    if (chunk.length === 9 && i + 9 < currentMovies.length) {
      moviesWithAds.push({ type: 'ad', data: null });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      {/* SEO Content Section */}
      <div className="container mx-auto px-4 pt-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Best Movie Recommendations & Streaming Guide
          </h1>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto mb-6">
            Discover the <strong>best movie recommendations</strong>, explore the complete <strong>Marvel movie list</strong>, 
            find the perfect <strong>anime series to watch</strong>, and get expert guides for <strong>Harry Potter watch order</strong>, 
            <strong>X-Men timeline</strong>, and <strong>Star Wars saga</strong>. Your ultimate destination for 
            <strong>top-rated movies</strong>, <strong>superhero movie rankings</strong>, and <strong>streaming suggestions</strong>.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-6">
            <div>🎬 Marvel Cinematic Universe</div>
            <div>⚡ X-Men Timeline Guide</div>
            <div>🧙‍♂️ Harry Potter Franchise</div>
            <div>🌟 Top Anime Recommendations</div>
            <div>🚗 Fast & Furious Series</div>
            <div>🧛‍♀️ Twilight Saga Order</div>
            <div>🌌 Star Wars Universe</div>
            <div>🎭 Best Movie Franchises</div>
          </div>
        </div>
        
        <AdsterraBanner className="mb-6" />
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <FilterControls
          genres={genres}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onGenreChange={handleGenreChange}
          contentType={contentType}
          onContentTypeChange={setContentType}
        />

        {/* Movies and Ads Grid */}
        {moviesWithAds.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.type === 'movies' ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-6">
                {section.data.map((movie, index) => (
                  <MovieCard
                    key={`${movie.id}-${sectionIndex}-${index}`}
                    movie={movie}
                  />
                ))}
              </div>
            ) : (
              <NativeBanner className="mb-6" />
            )}
          </div>
        ))}

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

        {/* Single Adsterra Banner after movies grid */}
        <AdsterraBanner className="mb-6" />

        <HomePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
          totalItems={allMovies.length}
        />

        {/* SEO Footer Content */}
        <div className="mt-12 text-center">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              Your Ultimate Movie & Series Destination
            </h2>
            <p className="text-gray-300 mb-4">
              Whether you're looking for <strong>Marvel movies ranked</strong>, the complete <strong>anime must-watch list</strong>, 
              or <strong>Netflix movie recommendations</strong>, CineStream is your go-to <strong>movie recommendation AI</strong>. 
              Explore <strong>superhero movie guides</strong>, discover <strong>underrated anime gems</strong>, and find your next 
              <strong>binge-worthy series</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div>
                <h3 className="text-white font-semibold mb-2">Popular Franchises</h3>
                <ul className="space-y-1">
                  <li>Marvel Cinematic Universe</li>
                  <li>DC Comics Movies</li>
                  <li>Star Wars Saga</li>
                  <li>Harry Potter Series</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Anime & Series</h3>
                <ul className="space-y-1">
                  <li>Top Anime Recommendations</li>
                  <li>Romantic Anime Series</li>
                  <li>Best Netflix Series</li>
                  <li>Dark Fantasy Anime</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Movie Genres</h3>
                <ul className="space-y-1">
                  <li>Best Sci-Fi Movies</li>
                  <li>Fantasy Movies</li>
                  <li>Action Movie Recommendations</li>
                  <li>Epic Movie Sagas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
