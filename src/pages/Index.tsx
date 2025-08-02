import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useMovieData } from '@/hooks/useMovieData';
import { useHomeSections } from '@/hooks/useHomeSections';
import { autoDiscoveryService } from '@/services/autoDiscoveryService';
import FilterControls from '@/components/FilterControls';
import HomePagination from '@/components/HomePagination';
import SEOHeader from '@/components/SEOHeader';
import MoviesWithSections from '@/components/MoviesWithSections';
import SEOFooter from '@/components/SEOFooter';
import { toast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 18;

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
      const lastDiscovery = localStorage.getItem('lastAutoDiscovery');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (!lastDiscovery || now - parseInt(lastDiscovery) > oneHour) {
        autoDiscoveryService.runAutoDiscovery().then(() => {
          localStorage.setItem('lastAutoDiscovery', now.toString());
          // Only show toast for actual auto-discovery, not for genre changes
          if (!selectedGenre) {
            toast({
              title: "Content Updated",
              description: "New movies and TV shows have been discovered and added to the database.",
              className: "notification-success"
            });
          }
        }).catch((error) => {
          console.error('Auto-discovery failed:', error);
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

  // Handle genre change - no notification toast
  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    console.log('Genre changed to:', value);
  };

  // Reset page when search term or genre changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedGenre, contentType]);

  const currentMovies = paginatedMovies();

  // Debug logging for genre filtering
  useEffect(() => {
    if (selectedGenre && selectedGenre !== 'all') {
      console.log('Selected genre:', selectedGenre);
      console.log('Available genres:', genres);
      console.log('Total movies available:', allMovies.length);
      console.log('Sample movies with genres:', allMovies.slice(0, 3).map(m => ({ 
        title: m.title, 
        genres: m.genres 
      })));
    }
  }, [selectedGenre, genres, allMovies]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 pt-6">
        <SEOHeader 
          selectedGenre={selectedGenre}
          genres={genres}
          showHomeSections={showHomeSections}
        />
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

        <MoviesWithSections
          currentMovies={currentMovies}
          showHomeSections={showHomeSections}
          newReleases={newReleases}
          greatestMovies={greatestMovies}
          highestRatedMovies={highestRatedMovies}
          highestRatedSeries={highestRatedSeries}
          isLoadingSections={isLoadingSections}
        />

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

        <SEOFooter />
      </div>
    </div>
  );
};

export default Index;
