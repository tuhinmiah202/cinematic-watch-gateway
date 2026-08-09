import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Play, User, Download, Server, Info, ShieldCheck, AlertCircle } from 'lucide-react';
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

  const handleBack = () => navigate(-1);

  // 1. Fetch content from TMDB/Supabase
  const { data: movie, isLoading } = useQuery({
    queryKey: ['content-detail', movieId],
    queryFn: async () => {
      if (movieId.length === 36) return await contentService.getContentById(movieId);
      const numericId = parseInt(movieId);
      try {
        return await tmdbService.getMovieDetails(numericId);
      } catch (e) {
        return await tmdbService.getTVShowDetails(numericId);
      }
    },
    enabled: !!movieId
  });

  const isTV = (movie as any)?.content_type === 'series' || !!(movie && ('name' in movie || 'first_air_date' in movie));
  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);
  const title = (movie as any)?.title || (movie as any)?.name || 'Untitled';

  // 2. Fetch from Custom Movie API on load
  useEffect(() => {
    const fetchApiData = async () => {
      if (!title || title === 'Untitled') return;

      // Clean movie name: remove year in brackets and special chars
      const cleanTitle = title.replace(/\(\d{4}\)/g, '').replace(/[^\w\s]/gi, ' ').trim();

      setIsApiLoading(true);
      setApiError(null);

      try {
        const response = await fetch(`https://web-production-69ea9.up.railway.app/get-telegram-movie?name=${encodeURIComponent(cleanTitle)}`);
        const data = await response.json();

        const results: ApiResult[] = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setApiResults(results);

        // Auto-Load Default Player: set src to first link in API results
        if (results.length > 0 && results[0].links && results[0].links.length > 0) {
          setSelectedStreamUrl(results[0].links[0]);
        } else {
          // Fallback if no results
          setSelectedStreamUrl(`https://vidsrc.to/embed/${isTV ? 'tv' : 'movie'}/${tmdbId}`);
        }
      } catch (error) {
        console.error("API Error:", error);
        setApiError('Server currently busy, please try another movie.');
        setSelectedStreamUrl(`https://vidsrc.to/embed/${isTV ? 'tv' : 'movie'}/${tmdbId}`);
      } finally {
        setIsApiLoading(false);
      }
    };

    if (movie) fetchApiData();
  }, [movie, title, tmdbId, isTV]);

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

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-red-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Navbar */}
      <div className="bg-black/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="hover:bg-white/10"><ArrowLeft className="w-5 h-5 mr-2" /> Back</Button>
          <h1 className="text-sm font-black truncate max-w-[200px] md:max-w-md uppercase tracking-tighter">{title}</h1>
          <div className="px-3 py-1 bg-red-600 rounded-full text-[10px] font-black animate-pulse">LIVE</div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* 1. PLAYER SECTION */}
          <section className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group">
              {isApiLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 z-20">
                  <Loader2 className="h-12 w-12 animate-spin text-red-600 mb-4" />
                  <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Searching for Hindi Servers...</p>
                </div>
              ) : (
                <iframe
                  id="movie-player"
                  key={selectedStreamUrl}
                  src={selectedStreamUrl || ''}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture"
                  sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
                ></iframe>
              )}
            </div>

            {/* AD-FILTERING TIP */}
            <div className="flex items-center gap-3 px-6 py-4 bg-zinc-900/50 border border-white/5 rounded-3xl">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <p className="text-[11px] text-zinc-400 font-medium">
                    <b>Tip:</b> For the best experience, use a browser with an <b>Ad-Blocker</b>. Pop-ups are blocked automatically.
                </p>
            </div>

            {/* SERVER SELECTION GRID */}
            <div className="bg-zinc-900/30 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                    <Server className="w-6 h-6 text-red-600" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-white">Select High-Speed Server</h2>
                </div>

                <div id="server-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {apiResults.map((server, idx) => (
                        <Button
                            key={idx}
                            onClick={() => {
                                setSelectedStreamUrl(server.links[0]);
                                toast({ title: `Switching to ${server.source || 'Server'}`, description: "Refreshing video player..." });
                            }}
                            className={`h-auto py-5 px-4 rounded-2xl text-[10px] font-black transition-all border-2 uppercase ${
                                selectedStreamUrl === server.links[0]
                                ? "bg-red-600 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] text-white"
                                : "bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 hover:scale-[1.02]"
                            }`}
                        >
                            {server.source || `SERVER ${idx + 1}`}
                        </Button>
                    ))}

                    {/* Fallback Stable Server */}
                    {!isApiLoading && apiResults.length === 0 && (
                         <Button
                            onClick={() => setSelectedStreamUrl(`https://vidsrc.to/embed/${isTV ? 'tv' : 'movie'}/${tmdbId}`)}
                            className="h-auto py-5 px-4 rounded-2xl text-[10px] font-black transition-all border-2 bg-red-600 border-red-500 text-white"
                         >
                            SERVER STABLE
                         </Button>
                    )}
                </div>
            </div>

            <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-200">
                    <b>No Sound?</b> For Hindi audio, click the <b>Gear (Settings)</b> icon inside the player and select <b>Hindi</b>.
                </p>
            </div>
          </section>

          {/* STORY & INFO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-10 border-t border-white/5">
            <div className="md:col-span-4">
                <img src={`https://image.tmdb.org/t/p/w500${(movie as any).poster_path}`} className="w-full rounded-[2.5rem] shadow-2xl border border-white/5" alt="" />
            </div>
            <div className="md:col-span-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                           {(movie as any).release_date?.split('-')[0] || (movie as any).first_air_date?.split('-')[0] || '2024'}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500">
                           <Star className="w-4 h-4 fill-current" />
                           <span className="font-black text-sm">{(movie as any).vote_average?.toFixed(1)}</span>
                        </div>
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">The Storyline</h2>
                    <p className="text-zinc-500 text-lg leading-relaxed">{(movie as any).overview}</p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white font-black uppercase"><User className="w-5 h-5 text-red-600" /> Top Cast</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tmdbCast?.slice(0, 4).map((actor: any) => (
                            <div key={actor.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center transition-all hover:bg-white/10">
                                <h4 className="text-xs font-bold truncate">{actor.name}</h4>
                                <p className="text-[10px] text-gray-500 truncate uppercase tracking-widest">{actor.character}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={() => window.open(`https://vidsrc.me/download/${isTV ? 'tv' : 'movie'}?tmdb=${tmdbId}`, '_blank')}
                        className="w-full h-20 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 rounded-3xl shadow-xl transition-all hover:scale-[1.02] group no-underline flex items-center justify-center gap-3 text-white"
                    >
                        <Download className="w-6 h-6 group-hover:animate-bounce" />
                        <span className="text-lg font-black italic uppercase">Download in Hindi / HD</span>
                    </Button>
                </div>
            </div>
          </div>

          {/* RELATED CONTENT */}
          <div className="pt-20">
            <h2 className="text-2xl font-black flex items-center gap-3 uppercase italic"><span className="w-2 h-8 bg-red-600 rounded-full"></span> More Like This</h2>
            <div className="relative mt-8">
                <Carousel opts={{ align: "start", slidesToScroll: 2 }} className="w-full">
                  <CarouselContent className="-ml-6">
                    {relatedContent.map((item, index) => (
                      <CarouselItem key={`${item.id}-${index}`} className="pl-6 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                        <MovieCard movie={item} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0 -translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-red-600 transition-all p-3" />
                  <CarouselNext className="right-0 translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-red-600 transition-all p-3" />
                </Carousel>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
