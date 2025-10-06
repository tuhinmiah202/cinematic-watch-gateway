import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Clock, ExternalLink } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import MovieCard from '@/components/MovieCard';
import { useAdClickTracker } from '@/hooks/useAdClickTracker';

const WatchMovie = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const movieId = id || '0';
  const [countdown, setCountdown] = useState(3);
  const [showWatchButton, setShowWatchButton] = useState(false);
  const { handleClickWithAd, clickCount } = useAdClickTracker(movieId);

  const handleBack = () => {
    // Always use browser's natural back behavior to prevent loops
    navigate(-1);
  };

  // Try to fetch from Supabase first (for admin content)
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-watch', movieId],
    queryFn: async () => {
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
      if (supabaseContent) return null;
      
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

  const isSupabaseContent = !!supabaseContent;
  const movie = supabaseContent || tmdbContent;
  const isLoading = isLoadingSupabase || isLoadingTmdb;
  const isTV = isSupabaseContent
    ? supabaseContent.content_type === 'series'
    : !!(tmdbContent && 'name' in tmdbContent);

  const { data: relatedContent, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['related-content', movieId, isTV],
    queryFn: async () => {
      if (isSupabaseContent) {
        // For Supabase content, show popular content as recommendations
        try {
          if (isTV) {
            const { results } = await tmdbService.getPopularTVShows();
            return results || [];
          } else {
            const { results } = await tmdbService.getPopularMovies();
            return results || [];
          }
        } catch (error) {
          console.error("Error fetching related content for Supabase item:", error);
          return [];
        }
      } else if (tmdbContent) {
        // For TMDB content, fetch recommendations
        const numericId = parseInt(movieId as string);
        if (isNaN(numericId)) return [];
        try {
          if (isTV) {
            const data = await tmdbService.getTVShowRecommendations(numericId);
            return data.results || [];
          } else {
            const data = await tmdbService.getMovieRecommendations(numericId);
            return data.results || [];
          }
        } catch (error) {
          console.error("Error fetching related content for TMDB item:", error);
          return [];
        }
      }
      return [];
    },
    enabled: !!movie && !isLoading,
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

  useEffect(() => {
    // Load native banner ad script
    const script = document.createElement('script');
    script.src = '//pl27791049.revenuecpmgate.com/74a3ef4065e44a43907ca65e4253d2c2/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleWatchNow = () => {
    handleClickWithAd(() => {
      const streamingUrl = (movie as any)?.streaming_links?.[0]?.url;
      
      if (streamingUrl) {
        window.open(streamingUrl, '_blank');
      } else {
        const title = (movie as any)?.title || (movie as any)?.name || 'movie';
        const searchQuery = encodeURIComponent(`watch ${title} online`);
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
      }
    });
  };

  const getClickMessage = () => {
    if (clickCount === 0) return "Click the button 2 times to proceed";
    if (clickCount === 1) return "Click 1 more time";
    return "Ready! Click to proceed";
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
          <Button 
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const title = isSupabaseContent ? (movie as any).title : ((movie as any).title || (movie as any).name);
  const posterUrl = isSupabaseContent 
    ? (movie as any).poster_url || '/placeholder.svg'
    : tmdbService.getImageUrl((movie as any).poster_path);

  const hasStreamingLink = (movie as any)?.streaming_links?.[0]?.url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <Button 
            onClick={handleBack}
            variant="outline" 
            size="sm" 
            className="bg-black/50 text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Movie
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
            {/* Poster and mobile title */}
            <div className="flex flex-row gap-4 items-start lg:block lg:col-span-4">
              <div className="w-1/3 lg:w-full shrink-0">
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-full h-auto object-cover rounded-xl shadow-2xl"
                />
              </div>
              <div className="w-2/3 lg:hidden">
                <h1 className="text-lg font-bold text-white mb-1 line-clamp-3">{title}</h1>
                <p className="text-xs text-gray-300">
                  {hasStreamingLink ? 'Direct streaming available' : 'Search for streaming options'}
                </p>
              </div>
            </div>

            {/* Details and Watch Button */}
            <div className="w-full lg:col-span-8 mt-6 lg:mt-0">
              {/* Movie Info for Desktop */}
              <div className="hidden lg:block mb-6 text-left">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{title}</h1>
                <p className="text-lg text-gray-300">
                  {hasStreamingLink ? 'Direct streaming available' : 'Search for streaming options'}
                </p>
              </div>

              {/* Countdown or Watch Button */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-purple-500/20">
                {!showWatchButton ? (
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">Preparing your stream...</h2>
                    <div className="text-4xl lg:text-5xl font-bold text-purple-400 mb-4">{countdown}</div>
                    <p className="text-gray-300 text-sm lg:text-base">Please wait while we prepare the best viewing options</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Play className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">Ready to Watch!</h2>
                    
                    {hasStreamingLink ? (
                      <>
                        <p className="text-gray-300 text-xs mb-4">{getClickMessage()}</p>
                        <div className="w-full max-w-sm mx-auto">
                          <Button 
                            onClick={handleWatchNow}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-base lg:text-lg px-6 py-3 lg:py-4 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                          >
                            <ExternalLink className="w-5 h-5 mr-2" />
                            Download Now
                          </Button>
                        </div>
                        
                        {/* Native Banner Ad */}
                        <div className="my-4">
                          <div id="container-74a3ef4065e44a43907ca65e4253d2c2"></div>
                        </div>
                        
                        <p className="text-gray-300 text-xs mt-3 px-4">
                          You will be redirected to the download link
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-300 text-xs mb-4">{getClickMessage()}</p>
                        <div className="w-full max-w-sm mx-auto">
                          <Button 
                            onClick={handleWatchNow}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-base lg:text-lg px-6 py-3 lg:py-4 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                          >
                            <ExternalLink className="w-5 h-5 mr-2" />
                            Find Streaming Options
                          </Button>
                        </div>
                        <p className="text-gray-300 text-xs mt-3 px-4">
                          You will be redirected to search for streaming options
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Related Content */}
          <div className="mt-12">
            {/* Related Content */}
            {relatedContent && relatedContent.length > 0 && (
              <div className="text-left relative">
                <h2 className="text-xl font-bold text-white mb-4">You might also like</h2>
                  <Carousel
                    opts={{
                      align: "start",
                      slidesToScroll: 2,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {relatedContent.map((movie, index) => (
                        <CarouselItem key={`${movie.id}-${index}`} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
                          <MovieCard movie={movie} />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 bg-black/50 text-white border-white/20 hover:bg-white/10 disabled:hidden" />
                    <CarouselNext className="right-2 bg-black/50 text-white border-white/20 hover:bg-white/10 disabled:hidden" />
                  </Carousel>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchMovie;
