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
  const [searchParams] = useSearchParams();
  const movieId = id || '0';

  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<ApiResult[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
    enabled: !!movieId && !supabaseContent && !isLoadingTmdb
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

  // Helper: Clean movie name for better API matching
  const cleanMovieName = (name: string) => {
    return name
      .replace(/\(\d{4}\)/g, '') // Remove (2024)
      .replace(/\[.*\]/g, '')     // Remove [Hindi]
      .replace(/[^\w\s]/gi, ' ')   // Replace special characters with space
      .trim();
  };

  // 3. API Integration for Servers
  useEffect(() => {
    const fetchApiData = async () => {
      if (!title || title === 'Untitled') return;

      const query = cleanMovieName(title);
      setIsApiLoading(true);
      setApiError(null);

      try {
        const response = await fetch(`https://web-production-69ea9.up.railway.app/get-telegram-movie?name=${encodeURIComponent(query)}`);
        const data = await response.json();

        const results: ApiResult[] = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setApiResults(results);

        // Requirement: Default Player sets src to first link in API results
        if (results.length > 0 && results[0].links && results[0].links.length > 0) {
          setSelectedStreamUrl(results[0].links[0]);
        }
      } catch (error) {
        console.error("API Error:", error);
        setApiError('Server currently busy, please try another movie.');
      } finally {
        setIsApiLoading(false);
      }
    };

    if (movie) fetchApiData();
  }, [movie, title]);

  // CATEGORIES FOR UI
  const streamServers = apiResults.filter(r =>
    r.links && r.links.length > 0 && (
      r.text.toUpperCase().includes('WATCH') ||
      r.text.toUpperCase().includes('PLAYER') ||
      r.text.toUpperCase().includes('STREAM') ||
      r.text.toUpperCase().includes('SERVER')
    )
  );

  const downloadLinks = apiResults.filter(r =>
    r.links && r.links.length > 0 && (
      r.text.toUpperCase().includes('PREMIUM') ||
      r.text.toUpperCase().includes('DIRECT') ||
      r.text.toUpperCase().includes('MEGA') ||
      r.text.toUpperCase().includes('DRIVE') ||
      r.text.toUpperCase().includes('PIXEL')
    )
  );

  // Fetch cast and related (Existing Logic)
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

  const posterUrl = (movie: any) => (movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.svg');

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

          {/* 1. VIDEO PLAYER SECTION */}
          <section id="player-container" className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
              {isApiLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                  <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Searching servers...</p>
                </div>
              ) : apiError && apiResults.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 text-white font-bold px-6 text-center">
                   {apiError}
                </div>
              ) : (
                <iframe
                  id="movie-player"
                  src={selectedStreamUrl || `https://vidsrc.to/embed/${isTV ? 'tv' : 'movie'}/${finalImdbId || tmdbId}`}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
              )}
            </div>

            {/* SERVER GRID */}
            <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                    <Server className="w-6 h-6 text-purple-500" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-purple-200">Select High-Speed Server</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Default Stable Link */}
                    <Button
                        onClick={() => setSelectedStreamUrl(`https://vidsrc.to/embed/${isTV ? 'tv' : 'movie'}/${finalImdbId || tmdbId}`)}
                        className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                            selectedStreamUrl?.includes('vidsrc.to') || !selectedStreamUrl
                            ? "bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.4)] text-white"
                            : "bg-white/5 border-white/5 hover:border-purple-500/50 text-gray-400 hover:text-white"
                        }`}
                    >
                        SERVER: STABLE
                    </Button>

                    {/* Bot Dynamic Buttons */}
                    {streamServers.map((server, idx) => {
                        const displayName = server.source?.toUpperCase() || server.text.replace(/\[.*\]/gi, '').split('-')[0].trim().toUpperCase() || `SERVER ${idx + 2}`;
                        const isSelected = selectedStreamUrl === server.links[0];

                        return (
                            <Button
                                key={idx}
                                onClick={() => {
                                    setSelectedStreamUrl(server.links[0]);
                                    toast({ title: `Switching to ${displayName}`, description: "Loading video stream..." });
                                }}
                                className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                                    isSelected
                                    ? "bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white"
                                    : "bg-white/5 border-white/5 hover:border-purple-500/50 text-gray-400 hover:text-white"
                                }`}
                            >
                                {displayName}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* HINDI AUDIO TIP */}
            <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-200">
                    <span className="font-bold">Tip:</span> For Hindi audio, click the <b>Gear (Settings)</b> icon inside the player and select <b>Hindi</b>.
                </p>
            </div>
          </section>

          {/* 2. DOWNLOAD CENTER */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4">
               <Download className="w-6 h-6 text-orange-500" />
               <h2 className="text-2xl font-black uppercase tracking-tighter">Premium Download Links</h2>
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
                        {link.text.replace(/\[PREMIUM\]|\[DIRECT\]/gi, '').trim() || 'Direct Download'}
                      </span>
                    </a>
                  ))}
                </div>
            ) : (
                <div className="p-10 bg-white/5 rounded-[2rem] border border-white/5 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                         <AlertCircle className="w-8 h-8 opacity-50" />
                         <p className="font-bold">Premium download links currently unavailable.</p>
                         <p className="text-xs">Try switching to SERVER: STABLE above for instant play.</p>
                    </div>
                </div>
            )}
          </section>

          {/* 3. STORY & INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-white/5">
            <div className="lg:col-span-4 space-y-6">
                <img src={posterUrl(movie)} alt={title} className="w-full rounded-[2rem] shadow-2xl border border-white/10" />
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-black uppercase">Rating</span>
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold">{(movie as any).vote_average?.toFixed(1)}</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-black uppercase">Release</span>
                        <span className="font-bold">{(movie as any).release_date || (movie as any).first_air_date || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Storyline</h2>
                    <p className="text-gray-400 leading-relaxed text-lg font-light">{(movie as any).overview}</p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-purple-400 font-black uppercase"><User className="w-5 h-5" /> Top Cast</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tmdbCast?.slice(0, 4).map((actor: any) => (
                            <div key={actor.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center transition-all hover:bg-white/10">
                                <h4 className="text-xs font-bold truncate">{actor.name}</h4>
                                <p className="text-[10px] text-gray-500 truncate uppercase tracking-widest">{actor.character}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* 4. RELATED CONTENT */}
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
