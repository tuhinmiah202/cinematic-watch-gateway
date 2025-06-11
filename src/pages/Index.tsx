
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService, ContentItem } from '@/services/contentService';
import { migrationService } from '@/services/migrationService';
import MovieCard from '@/components/MovieCard';
import Navbar from '@/components/Navbar';
import { Loader2, Film, Tv, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 24;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get state from URL parameters for better navigation
  const searchQuery = searchParams.get('search') || '';
  const contentType = (searchParams.get('type') as 'movie' | 'tv' | 'all') || 'all';
  const currentPage = parseInt(searchParams.get('page') || '1');
  
  const [headerSearchQuery, setHeaderSearchQuery] = useState(searchQuery);
  const [isClearing, setIsClearing] = useState(false);

  // Clear all existing content on app start
  useEffect(() => {
    const clearContent = async () => {
      setIsClearing(true);
      await migrationService.clearAllExistingContent();
      setIsClearing(false);
    };
    clearContent();
  }, []);

  // Update search params helper
  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    // Always reset to page 1 when other params change
    if (updates.page === undefined) {
      newParams.set('page', '1');
    }
    
    setSearchParams(newParams);
  };

  // Fetch Supabase content
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content', contentType, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        return await contentService.searchContent(searchQuery);
      }
      
      if (contentType === 'all') {
        return await contentService.getApprovedContent();
      } else {
        const type = contentType === 'tv' ? 'series' : contentType;
        return await contentService.getContentByType(type);
      }
    }
  });

  // Fetch TMDB content
  const { data: tmdbData, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-movies', searchQuery, contentType],
    queryFn: async () => {
      if (searchQuery) {
        return tmdbService.searchMovies(searchQuery);
      }
      
      if (contentType === 'all') {
        const [movieResults, tvResults] = await Promise.all([
          tmdbService.getPopularMovies(),
          tmdbService.getPopularTVShows()
        ]);
        return {
          results: [...movieResults.results, ...tvResults.results],
          total_pages: Math.max(movieResults.total_pages, tvResults.total_pages)
        };
      } else if (contentType === 'movie') {
        return tmdbService.getPopularMovies();
      } else if (contentType === 'tv') {
        return tmdbService.getPopularTVShows();
      }
      
      return tmdbService.getPopularMovies();
    }
  });

  const handleSearch = (query: string) => {
    updateSearchParams({
      search: query,
      page: '1'
    });
  };

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearchQuery.trim()) {
      handleSearch(headerSearchQuery.trim());
    }
  };

  const handleContentTypeChange = (type: 'movie' | 'tv' | 'all') => {
    updateSearchParams({
      type: type,
      page: '1'
    });
  };

  // Convert Supabase content to Movie format for compatibility
  const convertSupabaseToMovie = (item: ContentItem): Movie & { supabaseId: string } => ({
    id: parseInt(item.id.replace(/-/g, '').substring(0, 8), 16),
    title: item.content_type === 'movie' ? item.title : undefined,
    name: item.content_type === 'series' ? item.title : undefined,
    overview: item.description || '',
    poster_path: item.poster_url || '',
    backdrop_path: item.thumbnail_url || '',
    release_date: item.content_type === 'movie' ? `${item.release_year}-01-01` : undefined,
    first_air_date: item.content_type === 'series' ? `${item.release_year}-01-01` : undefined,
    genre_ids: item.genres?.map(g => g.tmdb_id).filter(Boolean) as number[] || [],
    vote_average: 8.0,
    vote_count: 100,
    media_type: item.content_type === 'movie' ? 'movie' : 'tv',
    type: item.content_type,
    streamingLink: item.streaming_links?.[0]?.url,
    year: item.release_year,
    description: item.description,
    supabaseId: item.id
  });

  // Combine content sources
  const combinedContent = () => {
    let supabaseItems: (Movie & { supabaseId: string })[] = [];
    let tmdbResults: Movie[] = [];

    // Convert Supabase content
    if (supabaseContent) {
      supabaseItems = supabaseContent.map(convertSupabaseToMovie);
    }

    // Get TMDB results
    if (tmdbData?.results) {
      tmdbResults = tmdbData.results;
      
      // Filter TMDB by content type
      if (contentType === 'movie') {
        tmdbResults = tmdbResults.filter((movie: Movie) => 
          !movie.media_type || movie.media_type === 'movie'
        );
      } else if (contentType === 'tv') {
        tmdbResults = tmdbResults.filter((movie: Movie) => 
          movie.media_type === 'tv'
        );
      }
    }

    // Prioritize Supabase content (admin-approved) first
    return [...supabaseItems, ...tmdbResults];
  };

  const allContent = combinedContent();
  const totalPages = Math.ceil(allContent.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedContent = allContent.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLoading = isLoadingSupabase || isLoadingTmdb || isClearing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 py-2">
        {/* Hero Section */}
        <div className="text-center mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CineStream
          </h1>
          <p className="text-sm text-gray-300 max-w-lg mx-auto mb-3">
            Discover and stream movies and series from around the world
          </p>
          
          {/* Header Search Bar */}
          <form onSubmit={handleHeaderSearch} className="max-w-md mx-auto mb-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search movies and series..."
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-sm h-9"
                />
              </div>
              <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 h-9 px-4 text-sm">
                Search
              </Button>
            </div>
          </form>
          
          {/* Content Type Selector */}
          <div className="flex justify-center gap-2 mb-3">
            <Button
              onClick={() => handleContentTypeChange('all')}
              variant={contentType === 'all' ? "default" : "outline"}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 h-7 ${
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
              className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 h-7 ${
                contentType === 'movie' 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                  : 'bg-transparent border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3 mr-1" />
              Movies
            </Button>
            <Button
              onClick={() => handleContentTypeChange('tv')}
              variant={contentType === 'tv' ? "default" : "outline"}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 h-7 ${
                contentType === 'tv' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                  : 'bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3 mr-1" />
              Series
            </Button>
          </div>
        </div>

        {/* AdSense Placeholder */}
        <div className="w-full h-8 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4">
          <p className="text-gray-400 text-xs">AdSense Advertisement Space</p>
        </div>

        {/* Content Display */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            {isClearing && <span className="ml-2 text-white text-sm">Clearing existing content...</span>}
          </div>
        ) : (
          <>
            {/* Content Counter */}
            <div className="text-center mb-4">
              <p className="text-gray-300 text-sm">
                Showing {paginatedContent.length} of {allContent.length} {contentType === 'movie' ? 'movies' : contentType === 'tv' ? 'series' : 'items'} 
                {searchQuery && ` for "${searchQuery}"`}
                (Page {currentPage} of {totalPages})
              </p>
            </div>

            {/* Movies Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-3">
              {paginatedContent.map((movie: any, index: number) => (
                <MovieCard key={movie.supabaseId || movie.id || `item-${index}`} movie={movie} />
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
