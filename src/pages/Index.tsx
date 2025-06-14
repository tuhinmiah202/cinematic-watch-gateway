import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService, ContentItem } from '@/services/contentService';
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
  const selectedGenre = searchParams.get('genre') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  
  const [headerSearchQuery, setHeaderSearchQuery] = useState(searchQuery);

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

  // Fetch Supabase content (admin-approved only)
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content', contentType, searchQuery, selectedGenre],
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

  // Fetch genres
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: contentService.getGenres
  });

  // Fetch TMDB content only if no Supabase content
  const { data: tmdbData, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-movies', searchQuery, contentType],
    queryFn: async () => {
      // Only fetch TMDB if no Supabase content available
      if (supabaseContent && supabaseContent.length > 0) {
        return { results: [] };
      }

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
    },
    enabled: !isLoadingSupabase
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

  const handleGenreChange = (genreName: string) => {
    updateSearchParams({
      genre: genreName === selectedGenre ? '' : genreName,
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

  // Combine content sources with proper genre filtering
  const combinedContent = () => {
    let supabaseItems: (Movie & { supabaseId: string })[] = [];
    let tmdbResults: Movie[] = [];

    // Convert Supabase content (prioritize admin-approved content)
    if (supabaseContent) {
      supabaseItems = supabaseContent.map(convertSupabaseToMovie);
    }

    // Get TMDB results only if no Supabase content
    if ((!supabaseContent || supabaseContent.length === 0) && tmdbData?.results) {
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

    // Combine all content
    let allContent = [...supabaseItems, ...tmdbResults];
    
    // Filter by genre if selected - use genre name matching for better compatibility
    if (selectedGenre) {
      allContent = allContent.filter(item => {
        // For Supabase content, check if any genre name matches
        if ((item as any).supabaseId) {
          const supabaseItem = supabaseContent?.find(s => s.id === (item as any).supabaseId);
          if (supabaseItem?.genres) {
            return supabaseItem.genres.some(g => 
              g.name?.toLowerCase() === selectedGenre.toLowerCase()
            );
          }
        }
        
        // For TMDB content, we need to map genre IDs to names
        const genreMap: { [key: number]: string } = {
          28: 'Action',
          35: 'Comedy',
          18: 'Drama',
          27: 'Horror',
          10749: 'Romance',
          53: 'Thriller',
          12: 'Adventure',
          80: 'Crime',
          16: 'Animation',
          99: 'Documentary',
          14: 'Fantasy',
          36: 'History',
          9648: 'Mystery',
          878: 'Science Fiction',
          10752: 'War',
          37: 'Western'
        };
        
        if (item.genre_ids) {
          return item.genre_ids.some(genreId => 
            genreMap[genreId]?.toLowerCase() === selectedGenre.toLowerCase()
          );
        }
        
        return false;
      });
    }

    return allContent;
  };

  const allContent = combinedContent();
  const totalPages = Math.ceil(allContent.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedContent = allContent.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLoading = isLoadingSupabase || isLoadingTmdb;

  // Common genres to display
  const commonGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Adventure', 'Crime'];

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

          {/* Genre Selector - Updated to show proper feedback */}
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {commonGenres.map((genre) => (
              <Button
                key={genre}
                onClick={() => handleGenreChange(genre)}
                variant={selectedGenre === genre ? "default" : "outline"}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 h-6 ${
                  selectedGenre === genre
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'bg-transparent border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white'
                }`}
              >
                {genre}
              </Button>
            ))}
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
          </div>
        ) : (
          <>
            {/* Content Counter */}
            <div className="text-center mb-4">
              <p className="text-gray-300 text-sm">
                Showing {paginatedContent.length} of {allContent.length} {contentType === 'movie' ? 'movies' : contentType === 'tv' ? 'series' : 'items'} 
                {searchQuery && ` for "${searchQuery}"`}
                {selectedGenre && ` in ${selectedGenre}`}
                (Page {currentPage} of {totalPages})
              </p>
            </div>

            {/* Movies Grid */}
            {paginatedContent.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No content available</p>
                <p className="text-gray-500 text-sm">Add movies and series through the admin panel</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-3">
                {paginatedContent.map((movie: any, index: number) => (
                  <MovieCard key={movie.supabaseId || movie.id || `item-${index}`} movie={movie} />
                ))}
              </div>
            )}

            {/* Simplified Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 px-4">
                <Button
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={`w-8 h-8 p-0 ${
                          currentPage === pageNum 
                            ? 'bg-purple-600 text-white' 
                            : 'text-white border-white/20 hover:bg-white/10'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 3 && currentPage < totalPages - 1 && (
                    <>
                      <span className="text-white px-1">...</span>
                      <Button
                        onClick={() => handlePageChange(totalPages)}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 text-white border-white/20 hover:bg-white/10"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
