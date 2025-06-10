
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Clock, Play, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0');

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => tmdbService.getMovieDetails(movieId),
    enabled: !!movieId
  });

  // Mock cast data since TMDB free API doesn't include cast
  const mockCast = [
    { name: "John Doe", character: "Main Character", profile_path: null },
    { name: "Jane Smith", character: "Supporting Role", profile_path: null },
    { name: "Mike Johnson", character: "Villain", profile_path: null },
    { name: "Sarah Williams", character: "Love Interest", profile_path: null }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-xl font-bold mb-4">Movie not found</h1>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Compact Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-black/50 text-white border-white/20">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* AdSense Placeholder */}
        <div className="w-full h-12 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4">
          <p className="text-gray-400 text-xs">AdSense Advertisement</p>
        </div>

        {/* Movie Info */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Single Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={tmdbService.getImageUrl(movie.poster_path)}
              alt={movie.title}
              className="w-40 h-60 md:w-48 md:h-72 object-cover rounded-lg shadow-xl"
            />
          </div>

          {/* Movie Details */}
          <div className="flex-1 text-white text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{movie.title}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">{movie.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{new Date(movie.release_date).getFullYear()}</span>
              </div>
              {movie.runtime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{movie.runtime} min</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
              {movie.genres.map((genre) => (
                <span 
                  key={genre.id}
                  className="px-2 py-1 bg-purple-600 rounded-full text-xs"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-4">{movie.overview}</p>

            <Link to={`/watch/${movie.id}`}>
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 w-full md:w-auto">
                <Play className="w-5 h-5 mr-2" />
                Watch Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Cast Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-4">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Cast
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mockCast.map((actor, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-white text-sm font-semibold">{actor.name}</h4>
                <p className="text-gray-400 text-xs">{actor.character}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Production Details */}
        {movie.production_companies && movie.production_companies.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-white mb-3">Production</h3>
            <div className="flex flex-wrap gap-2">
              {movie.production_companies.slice(0, 3).map((company) => (
                <span key={company.id} className="text-gray-300 text-sm bg-gray-700 px-2 py-1 rounded">
                  {company.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AdSense Placeholder */}
        <div className="w-full h-12 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center">
          <p className="text-gray-400 text-xs">AdSense Footer Advertisement</p>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
