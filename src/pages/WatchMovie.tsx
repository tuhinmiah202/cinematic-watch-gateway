import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Layout, Globe, Server, List } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import MovieCard from '@/components/MovieCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WatchMovie = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movieId = id || '0';

  const [selectedServer, setSelectedServer] = useState('server3');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleBack = () => {
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
        const details = await tmdbService.getMovieDetails(numericId);
        return details;
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
  const isTV = supabaseContent
    ? supabaseContent.content_type === 'series'
    : !!(tmdbContent && ('name' in tmdbContent || 'first_air_date' in tmdbContent));

  const tmdbId = movie?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);

  const { data: relatedContent } = useQuery({
    queryKey: ['related-content', movieId, isTV],
    queryFn: async () => {
      if (!tmdbId) return [];
      try {
        if (isTV) {
          const data = await tmdbService.getTVShowRecommendations(tmdbId);
          return data.results || [];
        } else {
          const data = await tmdbService.getMovieRecommendations(tmdbId);
          return data.results || [];
        }
      } catch (error) {
        return [];
      }
    },
    enabled: !!movie && !!tmdbId,
  });

  const getEmbedUrl = () => {
    if (!tmdbId) return '';

    // Server 1: AutoEmbed (Hindi Specialist - MovieLinkBD Style)
    // Server 2: Vidsrc.pro (Alternative Multi-Language)
    // Server 3: Vidsrc.me (Reliable fallback)

    if (isTV) {
      switch (selectedServer) {
        case 'server1':
          return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
        case 'server2':
          return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
        case 'server3':
          return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        default:
          return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
    } else {
      switch (selectedServer) {
        case 'server1':
          return `https://player.autoembed.cc/embed/movie/${tmdbId}`;
        case 'server2':
          return `https://vidsrc.pro/embed/movie/${tmdbId}`;
        case 'server3':
          return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
        default:
          return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Content not found</h1>
          <Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 text-white">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const title = movie.title || movie.name;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            onClick={handleBack}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="hidden md:inline">Back to Detail</span>
          </Button>
          <div className="flex-1 text-center truncate px-4">
            <h1 className="text-lg font-bold truncate">{title}</h1>
          </div>
          <div className="w-[100px] md:w-[150px]"></div> {/* Spacer for symmetry */}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Player Container */}
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
            <iframe
              src={getEmbedUrl()}
              className="w-full h-full"
              allowFullScreen
              frameBorder="0"
              scrolling="no"
              title="Player"
            ></iframe>

            {/* Disclaimer overlay for first load */}
            <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-gray-400 border border-white/10 uppercase tracking-widest font-black">
                {selectedServer === 'server1' ? 'Server 1: Hindi Priority' : selectedServer === 'server2' ? 'Server 2: Multi-Language' : 'Server 3: Fast Buffer'}
               </span>
            </div>
          </div>

          {/* Controls & Server Switcher */}
          <div className="mt-6 flex flex-col md:flex-row gap-6 items-start justify-between bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold">Select Server</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setSelectedServer('server1')}
                  variant={selectedServer === 'server1' ? 'default' : 'outline'}
                  className={selectedServer === 'server1' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}
                >
                  <Server className="w-4 h-4 mr-2" />
                  Server 1 (Hindi)
                </Button>
                <Button
                  onClick={() => setSelectedServer('server2')}
                  variant={selectedServer === 'server2' ? 'default' : 'outline'}
                  className={selectedServer === 'server2' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}
                >
                  <Server className="w-4 h-4 mr-2" />
                  Server 2
                </Button>
                <Button
                  onClick={() => setSelectedServer('server3')}
                  variant={selectedServer === 'server3' ? 'default' : 'outline'}
                  className={selectedServer === 'server3' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}
                >
                  <Server className="w-4 h-4 mr-2" />
                  Server 3
                </Button>
              </div>
              <p className="text-xs text-gray-500 italic">
                Tip: Server 1 (AutoEmbed) is specialized for Hindi Dubbed content. If audio is in English, check the player settings for a Hindi audio track.
              </p>
            </div>

            {isTV && (
              <div className="w-full md:w-auto space-y-4">
                <div className="flex items-center gap-3">
                  <List className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold">Episodes</h2>
                </div>
                <div className="flex gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black ml-1">Season</label>
                    <Select value={season.toString()} onValueChange={(v) => setSeason(parseInt(v))}>
                      <SelectTrigger className="w-24 bg-black/40 border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="S1" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10 text-white">
                        {[...Array(20)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>S {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black ml-1">Episode</label>
                    <Select value={episode.toString()} onValueChange={(v) => setEpisode(parseInt(v))}>
                      <SelectTrigger className="w-24 bg-black/40 border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="E1" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10 text-white">
                        {[...Array(50)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>E {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ad Protection Notice */}
          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-4">
            <div className="bg-yellow-500/20 p-2 rounded-xl">
              <Layout className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h4 className="text-yellow-500 font-bold text-sm">Player Optimization</h4>
              <p className="text-gray-400 text-xs mt-1">
                We've optimized the player for all browsers. If the video doesn't play, please try switching between Server 1, 2, or 3.
              </p>
            </div>
          </div>

          {/* Related Content */}
          <div className="mt-16">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                More Like This
            </h2>
            {relatedContent && relatedContent.length > 0 ? (
              <div className="relative">
                <Carousel
                  opts={{
                    align: "start",
                    slidesToScroll: 2,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {relatedContent.map((movie, index) => (
                      <CarouselItem key={`${movie.id}-${index}`} className="pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
                        <MovieCard movie={movie} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0 -translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-colors" />
                  <CarouselNext className="right-0 translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-colors" />
                </Carousel>
              </div>
            ) : (
              <p className="text-gray-500 italic">No recommendations found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchMovie;
