
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie, Genre } from '@/services/tmdbService';
import MovieCard from '@/components/MovieCard';
import GenreFilter from '@/components/GenreFilter';
import Navbar from '@/components/Navbar';
import { Loader2, Film, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleGenreSelect = (genreId: number | null) => {
    setSelectedGenre(genreId);
    setSearchQuery('');
  };

  const filteredMovies = moviesData?.results.filter((movie: Movie) => {
    if (contentType === 'all') return true;
    return contentType === 'movie' ? movie.vote_average > 7 : movie.vote_average <= 7;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 py-4">
        {/* AdSense Placeholder */}
        <div className="w-full h-16 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4">
          <p className="text-gray-400 text-xs">AdSense Advertisement Space</p>
        </div>

        {/* Compact Hero Section */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CineStream
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-xl mx-auto mb-4">
            Discover and stream movies and series from around the world
          </p>
          
          {/* Content Type Selector */}
          <div className="flex justify-center gap-2 mb-4">
            <Button
              onClick={() => setContentType('all')}
              variant={contentType === 'all' ? "default" : "outline"}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
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
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                contentType === 'movie' 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                  : 'bg-transparent border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4 mr-1" />
              Movies
            </Button>
            <Button
              onClick={() => setContentType('tv')}
              variant={contentType === 'tv' ? "default" : "outline"}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                contentType === 'tv' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                  : 'bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4 mr-1" />
              Series
            </Button>
          </div>
        </div>

        {/* AdSense Placeholder */}
        <div className="w-full h-12 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4">
          <p className="text-gray-400 text-xs">AdSense Banner Space</p>
        </div>

        {/* Genre Filter */}
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

            {/* AdSense Placeholder */}
            <div className="w-full h-16 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mt-6">
              <p className="text-gray-400 text-xs">AdSense Footer Advertisement</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
