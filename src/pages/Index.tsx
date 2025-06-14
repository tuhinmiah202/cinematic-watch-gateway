
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import MovieCard from '@/components/MovieCard';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import AdsterraBanner from '@/components/AdsterraBanner';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [supabaseMovies, setSupabaseMovies] = useState<any[]>([]);

  // Fetch genres from TMDB
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres().then(data => data.genres),
    initialData: []
  });

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

  // Infinite query for TMDB movies
  const {
    data: tmdbData,
    isLoading: isLoadingTmdb,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['tmdb-movies', selectedGenre, searchTerm],
    queryFn: ({ pageParam = 1 }) => tmdbService.getPopularMovies(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  // Combine and filter movies
  const displayedMovies = useCallback(() => {
    let combinedMovies: any[] = [...supabaseMovies];

    if (tmdbData) {
      tmdbData.pages.forEach((page) => {
        combinedMovies = combinedMovies.concat(page.results);
      });
    }

    // Filter by genre
    if (selectedGenre) {
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
  }, [supabaseMovies, tmdbData, selectedGenre, searchTerm, isSupabaseContent]);

  // Load more movies
  const loadMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    displayedMovies();
  }, [supabaseMovies, tmdbData, selectedGenre, searchTerm, displayedMovies]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Adsterra Banner at top */}
        <AdsterraBanner className="mb-6" />
        
        {/* Genre Filter and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search for movies..."
            className="flex-grow bg-gray-800 text-white border-purple-500/20 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-full md:w-52 bg-gray-800 text-white border-purple-500/20 rounded-lg">
              <SelectValue placeholder="Filter by Genre" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-purple-500/20 rounded-lg">
              <SelectItem value="">All Genres</SelectItem>
              {genres?.map((genre) => (
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

        {/* Movies Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {displayedMovies().map((movie, index) => (
            <MovieCard
              key={`${movie.id}-${index}`}
              movie={movie}
            />
          ))}
        </div>

        {/* Load More Button */}
        {hasNextPage && !isLoadingSupabaseInitial && !isLoadingTmdb && (
          <div className="text-center py-6">
            <Button 
              onClick={loadMore}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
            >
              Load More Movies
            </Button>
          </div>
        )}

        {/* No results message */}
        {!isLoadingSupabaseInitial && !isLoadingTmdb && displayedMovies().length === 0 && (
          <div className="text-center py-12">
            <p className="text-white text-lg">No movies found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or genre filter</p>
          </div>
        )}

        {/* Adsterra Banner at bottom */}
        <AdsterraBanner className="mt-6" />
      </div>
    </div>
  );
};

export default Index;
