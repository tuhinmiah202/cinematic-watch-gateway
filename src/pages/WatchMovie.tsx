
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Clock } from 'lucide-react';
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
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowWatchButton(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleWatchNow = () => {
    // In a real app, this would redirect to the streaming link from admin panel
    window.open('https://example-streaming-platform.com', '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <Link to={`/movie/${movieId}`}>
            <Button variant="outline" size="sm" className="text-white border-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Movie
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* AdSense Placeholder */}
        <div className="w-full h-24 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-8">
          <p className="text-gray-400 text-sm">AdSense Advertisement Space</p>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Movie Info */}
          {movie && (
            <div className="mb-12">
              <img
                src={tmdbService.getImageUrl(movie.poster_path)}
                alt={movie.title}
                className="w-48 h-72 object-cover rounded-xl shadow-2xl mx-auto mb-6"
              />
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{movie.title}</h1>
              <p className="text-xl text-gray-300">Watch on main streaming platform</p>
            </div>
          )}

          {/* AdSense Placeholder */}
          <div className="w-full h-20 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-8">
            <p className="text-gray-400 text-sm">AdSense Banner</p>
          </div>

          {/* Countdown or Watch Button */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-purple-500/20">
            {!showWatchButton ? (
              <div className="text-center">
                <Clock className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Preparing your stream...</h2>
                <div className="text-6xl font-bold text-purple-400 mb-4">{countdown}</div>
                <p className="text-gray-300 text-lg">Please wait while we connect you to the streaming platform</p>
              </div>
            ) : (
              <div className="text-center">
                <Play className="w-16 h-16 text-green-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-6">Ready to Watch!</h2>
                <Button 
                  onClick={handleWatchNow}
                  size="lg" 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-2xl px-12 py-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Play className="w-8 h-8 mr-3" />
                  Watch Now
                </Button>
                <p className="text-gray-300 text-sm mt-4">You will be redirected to the streaming platform</p>
              </div>
            )}
          </div>

          {/* AdSense Placeholder */}
          <div className="w-full h-24 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mt-8">
            <p className="text-gray-400 text-sm">AdSense Footer Advertisement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchMovie;
