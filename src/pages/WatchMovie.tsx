
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const WatchMovie = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = id || '0';
  const [countdown, setCountdown] = useState(5);
  const [showWatchButton, setShowWatchButton] = useState(false);

  // Try to fetch from Supabase first (for admin content)
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-watch', movieId],
    queryFn: async () => {
      // Check if this looks like a Supabase UUID
      if (movieId.includes('-') && movieId.length === 36) {
        return await contentService.getContentById(movieId);
      }
      return null;
    },
    enabled: !!movieId
  });

  // Fetch from TMDB if not found in Supabase
  const { data: tmdbContent, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-content-watch', movieId],
    queryFn: async () => {
      if (supabaseContent) return null; // Skip if we have Supabase content
      
      const numericId = parseInt(movieId);
      if (isNaN(numericId)) return null;
      
      try {
        return await tmdbService.getMovieDetails(numericId);
      } catch (movieError) {
        try {
          return await tmdbService.getTVShowDetails(numericId);
        } catch (tvError) {
          throw new Error('Content not found');
        }
      }
    },
    enabled: !!movieId && !supabaseContent && !isLoadingSupabase
  });

  const movie = supabaseContent || tmdbContent;
  const isLoading = isLoadingSupabase || isLoadingTmdb;

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
    // Get streaming URL from Supabase content or use default
    const streamingUrl = (movie as any)?.streaming_links?.[0]?.url || 'https://example-streaming-platform.com';
    window.open(streamingUrl, '_blank');
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-xl font-bold mb-4">Content not found</h1>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle both Supabase and TMDB content formats
  const isSupabaseContent = !!(movie as any).content_type;
  const title = isSupabaseContent ? (movie as any).title : ((movie as any).title || (movie as any).name);
  const posterUrl = isSupabaseContent 
    ? (movie as any).poster_url || '/placeholder.svg'
    : tmdbService.getImageUrl((movie as any).poster_path);

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
          <div className="mb-12">
            <img
              src={posterUrl}
              alt={title}
              className="w-48 h-72 object-cover rounded-xl shadow-2xl mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
            <p className="text-xl text-gray-300">Watch on main streaming platform</p>
          </div>

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
