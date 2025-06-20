
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

  // Split movies for native ad placement
  const currentMovies = paginatedMovies();
  const firstSixMovies = currentMovies.slice(0, 6);
  const remainingMovies = currentMovies.slice(6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      {/* Upper section banner ad */}
      <div className="container mx-auto px-4 pt-6">
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

        {/* Native Banner after Filter Controls */}
        <NativeBanner className="mb-6" />

        {/* First 6 movies */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-6">
          {firstSixMovies.map((movie, index) => (
            <MovieCard
              key={`${movie.id}-${index}`}
              movie={movie}
            />
          ))}
        </div>

        {/* Native Banner after 6 movies */}
        {firstSixMovies.length === 6 && <NativeBanner className="mb-6" />}

        {/* Remaining movies */}
        {remainingMovies.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8">
            {remainingMovies.map((movie, index) => (
              <MovieCard
                key={`${movie.id}-${index + 6}`}
                movie={movie}
              />
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
};

export default Index;
