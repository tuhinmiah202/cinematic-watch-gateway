
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
      {/* Mobile-First Hero Section */}
      <div className="relative">
        {/* Background Image */}
        <div 
          className="h-96 md:h-screen bg-cover bg-center relative"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(${tmdbService.getBackdropUrl(movie.backdrop_path)})`
          }}
        >
          {/* Navigation */}
          <div className="absolute top-4 left-4 z-10">
            <Link to="/">
              <Button variant="outline" size="sm" className="bg-black/50 text-white border-white/20 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          {/* AdSense Placeholder - Mobile Top */}
          <div className="absolute top-4 right-4 w-32 h-16 bg-black/30 border border-white/20 rounded flex items-center justify-center md:hidden">
            <p className="text-white text-xs">Ad</p>
          </div>

          {/* Content Container */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-end">
                {/* Movie Poster */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <img
                    src={tmdbService.getImageUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-48 md:w-64 h-72 md:h-96 object-cover rounded-xl shadow-2xl"
                  />
                </div>

                {/* Movie Info */}
                <div className="flex-1 text-white text-center md:text-left">
                  <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{movie.title}</h1>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mb-6">
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

                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                    {movie.genres.map((genre) => (
                      <span 
                        key={genre.id}
                        className="px-3 py-1 bg-purple-600 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  <Link to={`/watch/${movie.id}`}>
                    <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-4 w-full md:w-auto">
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

      {/* Movie Description Section */}
      <div className="container mx-auto px-4 py-8">
        {/* AdSense Placeholder */}
        <div className="w-full h-20 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-8">
          <p className="text-gray-400 text-sm">AdSense Advertisement</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-lg text-gray-300 leading-relaxed">{movie.overview}</p>
        </div>

        {/* Production Details */}
        {movie.production_companies && movie.production_companies.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Production</h3>
            <div className="flex flex-wrap gap-4">
              {movie.production_companies.slice(0, 4).map((company) => (
                <div key={company.id} className="text-gray-300">
                  {company.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AdSense Placeholder */}
        <div className="w-full h-20 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mt-8">
          <p className="text-gray-400 text-sm">AdSense Footer Advertisement</p>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
