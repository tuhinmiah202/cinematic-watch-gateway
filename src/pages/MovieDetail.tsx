import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { reviewService } from '@/services/reviewService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Clock, Play, User, Tv, Download, Globe, Server, Info, Maximize, List } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const movieId = id || '0';

  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string | null>(null);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleBack = () => {
    navigate(-1);
  };

  // 1. Fetch content from Supabase first
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-detail', movieId],
    queryFn: async () => {
      if (movieId.includes('-') && movieId.length === 36) {
        return await contentService.getContentById(movieId);
      }
      return null;
    },
    enabled: !!movieId
  });

  const isSupabaseContent = !!supabaseContent;

  // 2. Fetch from TMDB if not in Supabase, checking both Movie and TV
  const { data: tmdbContent, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-content-detail', movieId, searchParams.get('type')],
    queryFn: async () => {
      if (supabaseContent) return null;
      const numericId = parseInt(movieId);
      if (isNaN(numericId)) return null;

      const type = searchParams.get('type');

      if (type === 'tv') {
        return await tmdbService.getTVShowDetails(numericId);
      } else if (type === 'movie') {
        return await tmdbService.getMovieDetails(numericId);
      } else {
        try {
          // Try fetching as a movie first
          const movieDetails = await tmdbService.getMovieDetails(numericId);
          if (movieDetails && movieDetails.title) return movieDetails;
          throw new Error('Not a movie');
        } catch (e) {
          try {
            // If not a movie, try fetching as a TV show
            return await tmdbService.getTVShowDetails(numericId);
          } catch (tvError) {
            throw new Error('Content not found');
          }
        }
      }
    },
    enabled: !!movieId && !supabaseContent
  });

  const movie = supabaseContent || tmdbContent;
  const isLoading = isLoadingSupabase || (isLoadingTmdb && !supabaseContent);

  // Correctly identify if it's a TV show
  const isTV = useMemo(() => {
    if (supabaseContent) return supabaseContent.content_type === 'series';
    const type = searchParams.get('type');
    if (type) return type === 'tv';
    if (tmdbContent) return !!('name' in tmdbContent || 'first_air_date' in tmdbContent);
    return false;
  }, [supabaseContent, tmdbContent, searchParams]);

  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);

  // 3. Verified Active Servers (Hindi & Multi)
  const servers = useMemo(() => {
    if (!tmdbId) return [];

    // Server URLs with Season/Episode logic
    const moviePath = `movie/${tmdbId}`;
    const tvPath = `tv/${tmdbId}/${season}/${episode}`;
    const path = isTV ? tvPath : moviePath;

    return [
      { id: 1, name: 'HINDI: VIP', url: `https://vidsrc.in/embed/${path}`, type: 'hindi' },
      { id: 2, name: 'HINDI: AUTO', url: `https://autoembed.co/${isTV ? 'tv' : 'movie'}/tmdb/${tmdbId}${isTV ? `?s=${season}&e=${episode}` : ''}`, type: 'hindi' },
      { id: 3, name: 'SERVER: 2EMBED', url: `https://www.2embed.cc/embed/${isTV ? `tv?tmdb=${tmdbId}&s=${season}&e=${episode}` : `movie?tmdb=${tmdbId}`}`, type: 'multi' },
      { id: 4, name: 'SERVER: VIDSRC.ME', url: `https://vidsrc.me/embed/${isTV ? `tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}` : `movie?tmdb=${tmdbId}`}`, type: 'global' },
      { id: 5, name: 'SERVER: SMASHY', url: `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}${isTV ? `&season=${season}&episode=${episode}` : ''}`, type: 'alt' },
      { id: 6, name: 'SERVER: SUPER', url: `https://multiembed.mov/directbot.php?video_id=${tmdbId}&tmdb=1${isTV ? `&s=${season}&e=${episode}` : ''}`, type: 'bot' },
    ];
  }, [tmdbId, isTV, season, episode]);

  // Handle server/episode change
  useEffect(() => {
    if (servers.length > 0) {
      // Find currently selected server index or default to 0
      const currentIdx = servers.findIndex(s => s.url === selectedStreamUrl);
      const newUrl = currentIdx !== -1 ? servers[currentIdx].url : servers[0].url;
      setSelectedStreamUrl(newUrl);
    }
  }, [servers]);

  const primaryGenreId = (movie as any)?.genres?.[0]?.id ?? (movie as any)?.genre_ids?.[0] ?? null;
  const { data: relatedContent = [] } = useQuery({
    queryKey: ['detail-related', tmdbId, primaryGenreId, isTV],
    queryFn: async () => {
      if (!tmdbId || !primaryGenreId) return [];
      const response = isTV
        ? await tmdbService.getTVShowsByGenre(Number(primaryGenreId), 1)
        : await tmdbService.getMoviesByGenre(Number(primaryGenreId), 1);
      return (response.results || []).filter((item: any) => item.id !== tmdbId).slice(0, 10);
    },
    enabled: !!tmdbId && !!primaryGenreId
  });

  const { data: tmdbCast = [] } = useQuery({
    queryKey: ['detail-cast', tmdbId, isTV],
    queryFn: async () => {
      if (!tmdbId) return [];
      const response = await tmdbService.getCredits(Number(tmdbId), isTV ? 'tv' : 'movie');
      return response.cast;
    },
    enabled: !!tmdbId
  });

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"><div className="text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 text-white">Return Home</Button></div></div>;

  const title = (movie as any).title || (movie as any).name;
  const posterUrl = (movie: any) => (movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.svg');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5 mr-2" /> Back</Button>
          <h1 className="flex-1 text-center font-bold truncate px-4">{title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* 1. PLAYER & SELECTORS */}
          <section className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <iframe
                  key={`${selectedStreamUrl}-${season}-${episode}`}
                  src={selectedStreamUrl || ''}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
            </div>

            {/* SEASON/EPISODE SELECTOR (ONLY FOR TV) */}
            {isTV && (
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-3 shrink-0">
                        <List className="w-6 h-6 text-blue-400" />
                        <span className="font-bold uppercase tracking-tighter">Episode Selector</span>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-32">
                            <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block ml-1">Season</label>
                            <Select value={season.toString()} onValueChange={(v) => { setSeason(parseInt(v)); setEpisode(1); }}>
                                <SelectTrigger className="w-full bg-black/40 border-white/10 text-white rounded-xl h-12">
                                    <SelectValue placeholder="S1" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/10 text-white">
                                    {[...Array(20)].map((_, i) => (
                                        <SelectItem key={i+1} value={(i+1).toString()}>Season {i+1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 md:w-32">
                            <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block ml-1">Episode</label>
                            <Select value={episode.toString()} onValueChange={(v) => setEpisode(parseInt(v))}>
                                <SelectTrigger className="w-full bg-black/40 border-white/10 text-white rounded-xl h-12">
                                    <SelectValue placeholder="E1" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/10 text-white">
                                    {[...Array(50)].map((_, i) => (
                                        <SelectItem key={i+1} value={(i+1).toString()}>Episode {i+1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium italic">Selecting a new episode will automatically refresh the player.</p>
                </div>
            )}

            {/* SERVER SELECTION GRID */}
            <div className="space-y-4 bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <Server className="w-6 h-6 text-orange-500" />
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Choose Server</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Try Server 1 or 2 for Direct Hindi Audio</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {servers.map((server) => (
                        <Button
                            key={server.id}
                            onClick={() => setSelectedStreamUrl(server.url)}
                            className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                                selectedStreamUrl === server.url
                                ? "bg-orange-600 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.4)] text-white"
                                : "bg-white/5 border-white/10 hover:border-orange-500/50 text-gray-400 hover:text-white"
                            }`}
                        >
                            {server.name}
                        </Button>
                    ))}
                </div>
            </div>
          </section>

          {/* 2. STORY & INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-white/5">
            <div className="lg:col-span-4 space-y-6">
                <img src={posterUrl(movie)} alt={title} className="w-full rounded-[2rem] shadow-2xl border border-white/10" />
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Rating</span>
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold">{(movie as any).vote_average?.toFixed(1)}</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Year</span>
                        <span className="font-bold">{(movie as any).release_date?.split('-')[0] || (movie as any).first_air_date?.split('-')[0] || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">The Storyline</h2>
                    <p className="text-gray-400 leading-relaxed text-lg font-light">{(movie as any).overview}</p>
                </div>

                <div className="p-6 bg-purple-600/10 border border-purple-500/20 rounded-3xl flex items-start gap-4">
                    <Info className="w-6 h-6 text-purple-500 shrink-0" />
                    <p className="text-xs text-purple-200 leading-relaxed uppercase font-bold tracking-wider">
                        Note: For TV Series, use the selector above to change Seasons and Episodes.
                        Hindi Audio is usually found in Server 1 & 2.
                    </p>
                </div>
            </div>
          </div>

          {/* 3. RELATED CONTENT */}
          <div className="pt-20">
            <h2 className="text-2xl font-black flex items-center gap-3 uppercase italic"><span className="w-2 h-8 bg-purple-600 rounded-full"></span> More Like This</h2>
            <div className="relative mt-8">
                <Carousel opts={{ align: "start", slidesToScroll: 2 }} className="w-full">
                  <CarouselContent className="-ml-6">
                    {relatedContent.map((item, index) => (
                      <CarouselItem key={`${item.id}-${index}`} className="pl-6 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                        <MovieCard movie={item} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0 -translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-all p-3" />
                  <CarouselNext className="right-0 translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-all p-3" />
                </Carousel>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
