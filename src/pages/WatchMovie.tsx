
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const WatchMovie = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0');
  const [countdown, setCountdown] = useState(5);
  const [showWatchButton, setShowWatchButton] = useState(false);

  const { data: movie, isLoading } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => tmdbService.getMovieDetails(movieId),
    enabled: !!movieId
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowWatchButton(true);
    }
  }, [countdown]);

  const handleWatchNow = () => {
    // In a real application, this would redirect to the streaming link
    // For demo purposes, we'll show an alert
    alert('This would redirect to the streaming platform. Integration with admin-set streaming links would be implemented here.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!movie) {
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
      <div className="absolute top-4 left-4">
        <Link to={`/movie/${movieId}`}>
          <Button variant="outline" size="sm" className="bg-black/50 text-white border-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Movie
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Watch on Main Streaming Platform
          </h1>
          
          <div className="mb-8">
            <img
              src={tmdbService.getImageUrl(movie.poster_path)}
              alt={movie.title}
              className="w-64 h-96 object-cover rounded-xl shadow-2xl mx-auto"
            />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">{movie.title}</h2>
          
          {!showWatchButton ? (
            <div className="text-center">
              <div className="text-6xl font-bold text-purple-400 mb-4">{countdown}</div>
              <p className="text-xl text-gray-300">Preparing your streaming experience...</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <Button 
                size="lg" 
                onClick={handleWatchNow}
                className="bg-red-600 hover:bg-red-700 text-white text-xl px-12 py-6 animate-pulse"
              >
                <Play className="w-8 h-8 mr-3" />
                Watch Now
              </Button>
              <p className="text-sm text-gray-400 mt-4">
                Click to stream on the main platform
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchMovie;
