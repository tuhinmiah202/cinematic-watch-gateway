
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie, Genre } from '@/services/tmdbService';
import MovieCard from '@/components/MovieCard';
import GenreFilter from '@/components/GenreFilter';
import Navbar from '@/components/Navbar';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: tmdbService.getGenres
  });

  const { data: moviesData, isLoading, error } = useQuery({
    queryKey: ['movies', selectedGenre, searchQuery],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CineStream
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover and stream the latest movies and series from around the world
          </p>
        </div>

        {/* Genre Filter */}
        {genresData && (
          <GenreFilter 
            genres={genresData.genres} 
            selectedGenre={selectedGenre}
            onGenreSelect={handleGenreSelect}
          />
        )}

        {/* Movies Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 text-lg">
            Error loading movies. Please try again later.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {moviesData?.results.map((movie: Movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
