
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
    // For demo purposes, we'll use vote_average to simulate movie vs TV
    // In real implementation, you'd have separate APIs for movies and TV shows
    return contentType === 'movie' ? movie.vote_average > 7 : movie.vote_average <= 7;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 py-8">
        {/* AdSense Placeholder */}
        <div className="w-full h-24 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-8">
          <p className="text-gray-400 text-sm">AdSense Advertisement Space</p>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CineStream
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Discover and stream the latest movies and series from around the world
          </p>
          
          {/* Content Type Selector */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={() => setContentType('all')}
              variant={contentType === 'all' ? "default" : "outline"}
              className={`px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 ${
                contentType === 'all' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105' 
                  : 'bg-transparent border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white'
              }`}
            >
              All Content
            </Button>
            <Button
              onClick={() => setContentType('movie')}
              variant={contentType === 'movie' ? "default" : "outline"}
              className={`px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 ${
                contentType === 'movie' 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg transform scale-105' 
                  : 'bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white'
              }`}
            >
              <Film className="w-5 h-5 mr-2" />
              Movies
            </Button>
            <Button
              onClick={() => setContentType('tv')}
              variant={contentType === 'tv' ? "default" : "outline"}
              className={`px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 ${
                contentType === 'tv' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105' 
                  : 'bg-transparent border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-white'
              }`}
            >
              <Tv className="w-5 h-5 mr-2" />
              Series
            </Button>
          </div>
        </div>

        {/* AdSense Placeholder */}
        <div className="w-full h-20 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-8">
          <p className="text-gray-400 text-sm">AdSense Banner Space</p>
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
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 text-lg">
            Error loading content. Please try again later.
          </div>
        ) : (
          <>
            {/* Content Counter */}
            <div className="text-center mb-6">
              <p className="text-gray-300 text-lg">
                Showing {filteredMovies?.length || 0} {contentType === 'movie' ? 'movies' : contentType === 'tv' ? 'series' : 'items'}
              </p>
            </div>

            {/* Movies Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {filteredMovies?.map((movie: Movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* AdSense Placeholder */}
            <div className="w-full h-24 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mt-8">
              <p className="text-gray-400 text-sm">AdSense Footer Advertisement</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
