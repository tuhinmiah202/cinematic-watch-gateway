
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import MovieCard from '@/components/MovieCard';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Loader2 } from 'lucide-react';
import AdsterraBanner from '@/components/AdsterraBanner';

const ITEMS_PER_PAGE = 24;

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [supabaseMovies, setSupabaseMovies] = useState<any[]>([]);

  // Fetch genres from TMDB with better error handling
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      try {
        const response = await tmdbService.getGenres();
        console.log('Genres response:', response);
        // Ensure we return an array, even if the structure is different
        return response?.genres || [];
      } catch (error) {
        console.error('Error fetching genres:', error);
        return [];
      }
    },
  });

  // Ensure genres is always an array
  const genres = Array.isArray(genresData) ? genresData : [];

  // Function to determine if content is from Supabase
  const isSupabaseContent = (movie: any) => !!movie.content_type;

  // Initial fetch of Supabase content
  const {
    data: initialSupabaseData,
    isLoading: isLoadingSupabaseInitial,
  } = useQuery({
    queryKey: ['supabase-content-initial'],
    queryFn: () => contentService.getApprovedContent(),
  });

  // Update supabaseMovies when data is fetched
  useEffect(() => {
    if (initialSupabaseData) {
      setSupabaseMovies(initialSupabaseData);
    }
  }, [initialSupabaseData]);

  // Fetch TMDB movies for multiple pages to have enough content
  const {
    data: tmdbData,
    isLoading: isLoadingTmdb,
  } = useQuery({
    queryKey: ['tmdb-movies-paginated', selectedGenre, searchTerm],
    queryFn: async () => {
      const pages = [];
      // Fetch first 5 pages to have enough content for pagination
      for (let i = 1; i <= 5; i++) {
        const pageData = await tmdbService.getPopularMovies(i);
        pages.push(pageData);
      }
      return pages;
    },
  });

  // Combine and filter movies
  const allMovies = useCallback(() => {
    let combinedMovies: any[] = [...supabaseMovies];

    if (tmdbData) {
      tmdbData.forEach((page) => {
        combinedMovies = combinedMovies.concat(page.results);
      });
    }

    // Filter by genre
    if (selectedGenre && selectedGenre !== 'all') {
      combinedMovies = combinedMovies.filter((movie) => {
        if (isSupabaseContent(movie)) {
          return movie.genres?.some((genre: any) => genre.name === selectedGenre);
        } else {
          return movie.genre_ids?.includes(parseInt(selectedGenre));
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      combinedMovies = combinedMovies.filter((movie) => {
        const title = isSupabaseContent(movie) ? movie.title : movie.title || movie.name;
        return title?.toLowerCase().includes(lowerSearchTerm);
      });
    }

    return combinedMovies;
  }, [supabaseMovies, tmdbData, selectedGenre, searchTerm]);

  // Get movies for current page
  const paginatedMovies = useCallback(() => {
    const movies = allMovies();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return movies.slice(startIndex, endIndex);
  }, [allMovies, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(allMovies().length / ITEMS_PER_PAGE);

  // Handle search from navbar
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle genre change
  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            isActive={currentPage === 1}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            isActive={currentPage === totalPages}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(totalPages);
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Reset page when search term or genre changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGenre]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      {/* Upper section banner ad */}
      <div className="container mx-auto px-4 pt-6">
        <AdsterraBanner className="mb-6" />
      </div>
      
      <div className="container mx-auto px-4 py-6">
        {/* Genre Filter and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search for movies..."
            className="flex-grow bg-gray-800 text-white border-purple-500/20 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select onValueChange={handleGenreChange}>
            <SelectTrigger className="w-full md:w-52 bg-gray-800 text-white border-purple-500/20 rounded-lg">
              <SelectValue placeholder="Filter by Genre" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-purple-500/20 rounded-lg">
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.id} value={genre.id.toString()}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {(isLoadingSupabaseInitial || isLoadingTmdb) && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        )}

        {/* Movies Grid - Ensure 3 movies per row across all screen sizes */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {paginatedMovies().map((movie, index) => (
            <MovieCard
              key={`${movie.id}-${index}`}
              movie={movie}
            />
          ))}
        </div>

        {/* Single Adsterra Banner after movies grid */}
        <AdsterraBanner className="mb-6" />

        {/* Pagination */}
        {totalPages > 1 && !isLoadingSupabaseInitial && !isLoadingTmdb && (
          <Pagination className="mb-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {generatePaginationItems()}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* No results message */}
        {!isLoadingSupabaseInitial && !isLoadingTmdb && allMovies().length === 0 && (
          <div className="text-center py-12">
            <p className="text-white text-lg">No movies found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or genre filter</p>
          </div>
        )}

        {/* Page info */}
        {totalPages > 1 && !isLoadingSupabaseInitial && !isLoadingTmdb && (
          <div className="text-center text-gray-400 text-sm mb-6">
            Page {currentPage} of {totalPages} ({allMovies().length} total items)
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
