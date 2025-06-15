
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AdsterraBanner from '@/components/AdsterraBanner';
import { useDebounce } from '@/hooks/useDebounce';
import { useMovieData } from '@/hooks/useMovieData';
import FilterControls from '@/components/FilterControls';
import MovieGrid from '@/components/MovieGrid';
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

        <MovieGrid
          movies={paginatedMovies()}
          isLoading={isLoading}
        />

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
