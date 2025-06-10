
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Clock, Play } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0');

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => tmdbService.getMovieDetails(movieId),
    enabled: !!movieId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Hero Section with Backdrop */}
      <div 
        className="relative h-screen bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${tmdbService.getBackdropUrl(movie.backdrop_path)})`
        }}
      >
        <div className="absolute top-4 left-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-black/50 text-white border-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Movie Poster */}
              <div className="flex-shrink-0">
                <img
                  src={tmdbService.getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  className="w-64 h-96 object-cover rounded-xl shadow-2xl"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 text-white">
                <h1 className="text-5xl font-bold mb-4">{movie.title}</h1>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">{movie.vote_average.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                  {movie.runtime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>{movie.runtime} min</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres.map((genre) => (
                    <span 
                      key={genre.id}
                      className="px-3 py-1 bg-purple-600 rounded-full text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                <p className="text-lg text-gray-300 mb-8 max-w-3xl">{movie.overview}</p>

                <Link to={`/watch/${movie.id}`}>
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-4">
                    <Play className="w-6 h-6 mr-2" />
                    Watch Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
