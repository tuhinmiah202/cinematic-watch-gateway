
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie, Genre } from '@/services/tmdbService';
import MovieCard from '@/components/MovieCard';
import GenreFilter from '@/components/GenreFilter';
import Navbar from '@/components/Navbar';
import { Loader2, Film, Tv, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 24;

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [contentType, setContentType] = useState<'movie' | 'tv' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [managedContent, setManagedContent] = useState<any[]>([]);

  // Load managed content from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminManagedContent');
    if (saved) {
      setManagedContent(JSON.parse(saved));
    }
  }, []);

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: tmdbService.getGenres
  });

  const { data: moviesData, isLoading, error } = useQuery({
    queryKey: ['movies', selectedGenre, searchQuery, contentType, currentPage],
    queryFn: () => {
      if (searchQuery) {
        return tmdbService.searchMovies(searchQuery);
      }
      if (selectedGenre) {
        return tmdbService.getMoviesByGenre(selectedGenre);
      }
      return tmdbService.getPopularMovies();
    }
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedGenre(null);
    setCurrentPage(1);
  };

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearchQuery.trim()) {
      handleSearch(headerSearchQuery.trim());
    }
  };

  const handleGenreSelect = (genreId: number | null) => {
    setSelectedGenre(genreId);
    setSearchQuery('');
    setHeaderSearchQuery('');
    setCurrentPage(1);
  };

  const handleContentTypeChange = (type: 'movie' | 'tv' | 'all') => {
    setContentType(type);
    setCurrentPage(1);
  };

  // Combine TMDB data with managed content, putting managed content first
  const combinedContent = () => {
    let tmdbResults = moviesData?.results || [];
    let filteredManagedContent = managedContent;

    // Filter managed content by type
    if (contentType === 'movie') {
      filteredManagedContent = managedContent.filter(item => item.type === 'movie');
      tmdbResults = tmdbResults.filter((movie: Movie) => movie.media_type !== 'tv');
    } else if (contentType === 'tv') {
      filteredManagedContent = managedContent.filter(item => item.type === 'series');
      tmdbResults = tmdbResults.filter((movie: Movie) => movie.media_type === 'tv');
    }

    // Filter by genre if selected
    if (selectedGenre && selectedGenre < 900) {
      tmdbResults = tmdbResults.filter((movie: Movie) => 
        movie.genre_ids?.includes(selectedGenre)
      );
    }

    // Handle custom genres (Bollywood, K-Drama)
    if (selectedGenre === 999) { // Bollywood
      filteredManagedContent = filteredManagedContent.filter(item => 
        item.title.toLowerCase().includes('bollywood') || 
        item.description?.toLowerCase().includes('bollywood')
      );
      tmdbResults = tmdbResults.filter((movie: Movie) => 
        movie.title.toLowerCase().includes('bollywood') ||
        movie.overview?.toLowerCase().includes('bollywood')
      );
    } else if (selectedGenre === 998) { // K-Drama
      filteredManagedContent = filteredManagedContent.filter(item => 
        item.title.toLowerCase().includes('korean') || 
        item.description?.toLowerCase().includes('korean')
      );
      tmdbResults = tmdbResults.filter((movie: Movie) => 
        movie.title.toLowerCase().includes('korean') ||
        movie.overview?.toLowerCase().includes('korean')
      );
    }

    // Search filter
    if (searchQuery) {
      filteredManagedContent = filteredManagedContent.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      tmdbResults = tmdbResults.filter((movie: Movie) =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return [...filteredManagedContent, ...tmdbResults];
  };

  const allContent = combinedContent();
  const totalPages = Math.ceil(allContent.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedContent = allContent.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 py-2">
        {/* Compact Hero Section */}
        <div className="text-center mb-3">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CineStream
          </h1>
          <p className="text-xs text-gray-300 max-w-lg mx-auto mb-2">
            Discover and stream movies and series from around the world
          </p>
          
          {/* Header Search Bar */}
          <form onSubmit={handleHeaderSearch} className="max-w-md mx-auto mb-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  type="text"
                  placeholder="Search movies and series..."
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                  className="pl-8 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-xs h-8"
                />
              </div>
              <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 px-3 text-xs">
                Search
              </Button>
            </div>
          </form>
          
          {/* Content Type Selector */}
          <div className="flex justify-center gap-1 mb-2">
            <Button
              onClick={() => handleContentTypeChange('all')}
              variant={contentType === 'all' ? "default" : "outline"}
              className={`px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300 h-6 ${
                contentType === 'all' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-transparent border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white'
              }`}
            >
              All Content
            </Button>
            <Button
              onClick={() => handleContentTypeChange('movie')}
              variant={contentType === 'movie' ? "default" : "outline"}
              className={`px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300 h-6 ${
                contentType === 'movie' 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                  : 'bg-transparent border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white'
              }`}
            >
              <Film className="w-2 h-2 mr-1" />
              Movies
            </Button>
            <Button
              onClick={() => handleContentTypeChange('tv')}
              variant={contentType === 'tv' ? "default" : "outline"}
              className={`px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300 h-6 ${
                contentType === 'tv' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                  : 'bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-white'
              }`}
            >
              <Tv className="w-2 h-2 mr-1" />
              Series
            </Button>
          </div>
        </div>

        {/* Single AdSense Placeholder */}
        <div className="w-full h-8 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-3">
          <p className="text-gray-400 text-xs">AdSense Advertisement Space</p>
        </div>

        {/* Compact Genre Filter */}
        {genresData && (
          <GenreFilter 
            genres={genresData.genres} 
            selectedGenre={selectedGenre}
            onGenreSelect={handleGenreSelect}
          />
        )}

        {/* Content Display */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400">
            Error loading content. Please try again later.
          </div>
        ) : (
          <>
            {/* Content Counter */}
            <div className="text-center mb-3">
              <p className="text-gray-300 text-sm">
                Showing {paginatedContent.length} of {allContent.length} {contentType === 'movie' ? 'movies' : contentType === 'tv' ? 'series' : 'items'} (Page {currentPage} of {totalPages})
              </p>
            </div>

            {/* Movies Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-2">
              {paginatedContent.map((movie: any, index: number) => (
                <MovieCard key={movie.id || `managed-${index}`} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
