import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { reviewService } from '@/services/reviewService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Clock, Play, User, Tv, Download, Globe, Server, Info, Maximize, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useToast } from "@/hooks/use-toast";

interface ApiResult {
  text: string;
  links: string[];
  source?: string;
}

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const movieId = id || '0';

  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<ApiResult[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // States for TV Shows
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleBack = () => {
    navigate(-1);
  };

  // 1. Fetch content from Supabase or TMDB
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

  const { data: tmdbContent, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-content-detail', movieId],
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

  const movie = supabaseContent || tmdbContent;
  const isLoading = isLoadingSupabase || (isLoadingTmdb && !supabaseContent);
  const isTV = supabaseContent
    ? supabaseContent.content_type === 'series'
    : !!(tmdbContent && ('name' in tmdbContent || 'first_air_date' in tmdbContent));

  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);
  const imdbId = (movie as any)?.imdb_id || (movie as any)?.external_ids?.imdb_id;

  // 2. Fetch External IDs for IMDB ID
  const { data: externalIds } = useQuery({
    queryKey: ['tmdb-external-ids-detail', tmdbId, isTV],
    queryFn: async () => {
      if (!tmdbId) return null;
      const url = `https://api.themoviedb.org/3/${isTV ? 'tv' : 'movie'}/${tmdbId}/external_ids?api_key=566149bf98e53cc39a4c04bfe01c03fc`;
      const res = await fetch(url);
      return res.json();
    },
    enabled: !!tmdbId && !imdbId
  });

  const finalImdbId = useMemo(() => {
    const rawId = imdbId || externalIds?.imdb_id;
    if (!rawId) return null;
    const idStr = rawId.toString();
    return idStr.startsWith('tt') ? idStr : `tt${idStr}`;
  }, [imdbId, externalIds]);

  const title = (movie as any)?.title || (movie as any)?.name || 'Untitled';

  // Define High-Quality Servers based on TMDB ID
  const primaryServers = useMemo(() => {
    if (!tmdbId) return [];
    const base = isTV ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`;
    return [
      { name: 'HDHub (Hindi)', url: `https://vidsrc.cc/v2/embed/${base}`, type: 'Hindi' },
      { name: 'HBOX (Hindi Focus)', url: `https://hbox.vidsrc.xyz/embed/${base}`, type: 'Hindi' },
      { name: 'HINDI (Only)', url: `https://vidsrc.in/embed/${base}`, type: 'Hindi' },
      { name: 'SuperEmbed', url: `https://multiembed.mov/directbot.php?video_id=${tmdbId}&tmdb=1${isTV ? `&s=${season}&e=${episode}` : ''}`, type: 'Multi' },
    ];
  }, [tmdbId, isTV, season, episode]);

  const alternativeServers = useMemo(() => {
    if (!tmdbId) return [];
    const base = isTV ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`;
    return [
      { name: 'ALICE', url: `https://vidsrc.to/embed/${base}`, type: 'Multi' },
      { name: 'MONGO', url: `https://vidsrc.me/embed/${base}`, type: 'Multi' },
      { name: 'NITRO', url: `https://nitro.vidsrc.xyz/embed/${base}`, type: 'Multi' },
    ];
  }, [tmdbId, isTV, season, episode]);

  // Set default player to HDHub on load
  useEffect(() => {
    if (primaryServers.length > 0 && !selectedStreamUrl) {
      setSelectedStreamUrl(primaryServers[0].url);
    }
  }, [primaryServers, selectedStreamUrl]);

  // 3. API Integration for additional links (keeping your bot integration)
  useEffect(() => {
    const fetchApiData = async () => {
      if (!title || title === 'Untitled') return;
      const cleanTitle = title.replace(/\(\d{4}\)/g, '').replace(/[^\w\s]/gi, ' ').trim();
      setIsApiLoading(true);
      try {
        const response = await fetch(`https://web-production-69ea9.up.railway.app/get-telegram-movie?name=${encodeURIComponent(cleanTitle)}`);
        const data = await response.json();
        const results: ApiResult[] = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setApiResults(results);
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setIsApiLoading(false);
      }
    };
    if (movie) fetchApiData();
  }, [movie, title]);

  const downloadLinks = apiResults.filter(r =>
    r.links && r.links.length > 0 && r.text.toUpperCase().includes('PREMIUM')
  );

  // Fetch cast and related
  const { data: tmdbCast } = useQuery({
    queryKey: ['tmdb-cast-detail', tmdbId],
    queryFn: async () => {
      if (!tmdbId) return [];
      const url = `https://api.themoviedb.org/3/${isTV ? 'tv' : 'movie'}/${tmdbId}/credits?api_key=566149bf98e53cc39a4c04bfe01c03fc`;
      const res = await fetch(url);
      const data = await res.json();
      return data.cast?.slice(0, 8) || [];
    },
    enabled: !!tmdbId
  });

  const primaryGenreId = (movie as any)?.genres?.[0]?.id ?? (movie as any)?.genre_ids?.[0] ?? null;
  const { data: relatedContent = [] } = useQuery({
    queryKey: ['detail-related', tmdbId, primaryGenreId],
    queryFn: async () => {
      if (!tmdbId || !primaryGenreId) return [];
      const response = isTV
        ? await tmdbService.getTVShowsByGenre(Number(primaryGenreId), 1)
        : await tmdbService.getMoviesByGenre(Number(primaryGenreId), 1);
      return (response.results || []).filter((item: any) => item.id !== tmdbId).slice(0, 10);
    },
    enabled: !!tmdbId && !!primaryGenreId
  });

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"><div className="text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 text-white">Return Home</Button></div></div>;

  const moviePosterUrl = (movie: any) => (movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.svg');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5 mr-2" /> Back</Button>
          <h1 className="flex-1 text-center font-bold truncate px-4">{title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* 1. PRIMARY VIDEO PLAYER */}
          <section className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
                <iframe
                  id="movie-player"
                  src={selectedStreamUrl || ''}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
                <div className="absolute top-6 left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-4 py-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] text-white uppercase font-black tracking-widest">Server Active</span>
                    </div>
                </div>
            </div>

            {/* HINDI AUDIO NOTE */}
            <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl flex items-center gap-3">
                <Info className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-xs text-orange-200">
                    <span className="font-bold">Pro Tip:</span> Click the <b>Gear (Settings)</b> icon inside the player to change audio to <b>Hindi</b>.
                </p>
            </div>

            {/* SERVER SELECTION GRID */}
            <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                    <Server className="w-6 h-6 text-purple-500" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-purple-200">Select Streaming Server</h2>
                </div>

                <div className="space-y-6">
                    {/* Primary Hindi/Multi Servers */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Hindi & Multi-Audio (Recommended)</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {primaryServers.map((server, idx) => (
                                <Button
                                    key={`primary-${idx}`}
                                    onClick={() => setSelectedStreamUrl(server.url)}
                                    className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                                        selectedStreamUrl === server.url
                                        ? "bg-orange-600 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.4)] text-white"
                                        : "bg-white/5 border-white/5 hover:border-orange-500/50 text-gray-400 hover:text-white"
                                    }`}
                                >
                                    {server.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Alternative Multi-Lang Servers */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Alternative Servers</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {alternativeServers.map((server, idx) => (
                                <Button
                                    key={`alt-${idx}`}
                                    onClick={() => setSelectedStreamUrl(server.url)}
                                    className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                                        selectedStreamUrl === server.url
                                        ? "bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.4)] text-white"
                                        : "bg-white/5 border-white/5 hover:border-purple-500/50 text-gray-400 hover:text-white"
                                    }`}
                                >
                                    {server.name}
                                </Button>
                            ))}
                            {/* Bot Servers from API */}
                            {apiResults.slice(0, 5).map((server, idx) => (
                                <Button
                                    key={`bot-${idx}`}
                                    onClick={() => setSelectedStreamUrl(server.links[0])}
                                    className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                                        selectedStreamUrl === server.links[0]
                                        ? "bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white"
                                        : "bg-white/5 border-white/5 hover:border-blue-500/50 text-gray-400 hover:text-white"
                                    }`}
                                >
                                    {server.text.replace(/\[.*\]/gi, '').split('-')[0].trim() || `BOT SERVER ${idx+1}`}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </section>

          {/* 2. DOWNLOAD CENTER */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4">
               <Download className="w-6 h-6 text-orange-500" />
               <h2 className="text-2xl font-black uppercase tracking-tighter">Download Center</h2>
            </div>

            {isApiLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                  ))}
               </div>
            ) : downloadLinks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {downloadLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.links[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="h-16 bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 rounded-2xl shadow-xl transition-all hover:scale-[1.03] group no-underline flex items-center justify-center px-6 gap-3 text-white"
                    >
                      <Download className="w-5 h-5" />
                      <span className="font-bold text-xs truncate uppercase tracking-tight text-center">
                        {link.text.replace(/\[PREMIUM\]/gi, '').trim() || 'High Speed Download'}
                      </span>
                    </a>
                  ))}
                </div>
            ) : (
                <div className="p-10 bg-white/5 rounded-[2rem] border border-white/5 text-center text-gray-500">
                    <p className="font-bold">Premium download links searching...</p>
                    <p className="text-xs">Switch servers above for instant streaming in Hindi.</p>
                </div>
            )}
          </section>

          {/* 3. STORY & INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-white/5">
            <div className="lg:col-span-4 space-y-6">
                <img src={moviePosterUrl(movie)} alt={title} className="w-full rounded-[2rem] shadow-2xl border border-white/10" />
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-black uppercase">Rating</span>
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold">{(movie as any).vote_average?.toFixed(1)}</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-black uppercase">Release</span>
                        <span className="font-bold">{(movie as any).release_date || (movie as any).first_air_date || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-black uppercase">Runtime</span>
                        <span className="font-bold">{(movie as any).runtime || 'N/A'} min</span>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Storyline</h2>
                    <p className="text-gray-400 leading-relaxed text-lg font-light">{(movie as any).overview}</p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-purple-400"><User className="w-5 h-5" /> Top Cast</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tmdbCast?.map((actor: any) => (
                            <div key={actor.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center transition-all hover:bg-white/10">
                                <h4 className="text-sm font-bold truncate">{actor.name}</h4>
                                <p className="text-[10px] text-gray-500 truncate">{actor.character}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* 4. RELATED CONTENT */}
          <div className="pt-20">
            <h2 className="text-2xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-purple-600 rounded-full"></span> Handpicked For You</h2>
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
