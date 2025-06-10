
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie, Genre } from '@/services/tmdbService';
import MovieCard from '@/components/MovieCard';
import GenreFilter from '@/components/GenreFilter';
import Navbar from '@/components/Navbar';
import { Loader2, Film, Tv, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [contentType, setContentType] = useState<'movie' | 'tv' | 'all'>('all');

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: tmdbService.getGenres
  });

  const { data: moviesData, isLoading, error } = useQuery({
    queryKey: ['movies', selectedGenre, searchQuery, contentType],
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
  };

  const filteredMovies = moviesData?.results.filter((movie: Movie) => {
    if (contentType === 'all') return true;
    return contentType === 'movie' ? movie.vote_average > 7 : movie.vote_average <= 7;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 py-3">
        {/* Compact Hero Section */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CineStream
          </h1>
          <p className="text-xs md:text-sm text-gray-300 max-w-lg mx-auto mb-3">
            Discover and stream movies and series from around the world
          </p>
          
          {/* Header Search Bar */}
          <form onSubmit={handleHeaderSearch} className="max-w-md mx-auto mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search movies and series..."
                value={headerSearchQuery}
                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-sm h-9"
              />
            </div>
          </form>
          
          {/* Content Type Selector */}
          <div className="flex justify-center gap-2 mb-3">
            <Button
              onClick={() => setContentType('all')}
              variant={contentType === 'all' ? "default" : "outline"}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                contentType === 'all' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-transparent border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white'
              }`}
            >
              All Content
            </Button>
            <Button
              onClick={() => setContentType('movie')}
              variant={contentType === 'movie' ? "default" : "outline"}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                contentType === 'movie' 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                  : 'bg-transparent border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3 mr-1" />
              Movies
            </Button>
            <Button
              onClick={() => setContentType('tv')}
              variant={contentType === 'tv' ? "default" : "outline"}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
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

        {/* Single AdSense Placeholder */}
        <div className="w-full h-10 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4">
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
            <div className="text-center mb-4">
              <p className="text-gray-300 text-sm">
                Showing {filteredMovies?.length || 0} {contentType === 'movie' ? 'movies' : contentType === 'tv' ? 'series' : 'items'}
              </p>
            </div>

            {/* Movies Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {filteredMovies?.map((movie: Movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* Bottom AdSense Placeholder */}
            <div className="w-full h-12 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mt-6">
              <p className="text-gray-400 text-xs">AdSense Footer Advertisement</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
