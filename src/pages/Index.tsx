
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useMovieData } from '@/hooks/useMovieData';
import { useHomeSections } from '@/hooks/useHomeSections';
import FilterControls from '@/components/FilterControls';
import HomePagination from '@/components/HomePagination';
import SEOHeader from '@/components/SEOHeader';
import MoviesWithSections from '@/components/MoviesWithSections';
import SEOFooter from '@/components/SEOFooter';
import TrendingHero from '@/components/TrendingHero';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contentType, setContentType] = useState('all');

  const { genres, allMovies, totalPages, isLoading } = useMovieData(selectedGenre, debouncedSearchTerm, contentType, currentPage);
  const {
    trending,
    newReleases,
    greatestMovies,
    highestRatedMovies,
    highestRatedSeries,
    isLoading: isLoadingSections
  } = useHomeSections();

  // Show hero and sections only when there's no search or filter applied AND we're on page 1
  const isDefaultView = !debouncedSearchTerm && !selectedGenre && contentType === 'all' && currentPage === 1;

  // Handle search from navbar or filter controls
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
  };

  // Reset page when search term or genre changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedGenre, contentType]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      {isDefaultView && (
        <TrendingHero items={trending} isLoading={isLoadingSections} />
      )}

      <div className="container mx-auto px-4 pt-6">
        <SEOHeader 
          selectedGenre={selectedGenre}
          genres={genres}
          showHomeSections={isDefaultView}
        />
      </div>
      
      <div className="container mx-auto px-4 py-4 min-h-screen">
        <div className="mb-8">
            <FilterControls
              genres={genres}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onGenreChange={handleGenreChange}
              contentType={contentType}
              onContentTypeChange={setContentType}
            />
        </div>

        <MoviesWithSections
          currentMovies={allMovies}
          showHomeSections={isDefaultView}
          newReleases={newReleases}
          greatestMovies={greatestMovies}
          highestRatedMovies={highestRatedMovies}
          highestRatedSeries={highestRatedSeries}
          isLoadingSections={isLoadingSections}
        />

        {/* Show loading or no movies message if needed */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          </div>
        )}

        {!isLoading && allMovies.length === 0 && (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800">
            <p className="text-white text-2xl font-bold">No results found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or searching for something else</p>
          </div>
        )}

        {!isDefaultView && (
            <HomePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
              totalItems={allMovies.length * totalPages} // Approximation
            />
        )}

        <SEOFooter />
      </div>
    </div>
  );
};

export default Index;
