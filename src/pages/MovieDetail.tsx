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

  // State for TV Series
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
    queryKey: ['tmdb-content-detail', movieId, searchParams.get('type')],
    queryFn: async () => {
      if (supabaseContent) return null;
      const numericId = parseInt(movieId);
      if (isNaN(numericId)) return null;

      const type = searchParams.get('type');
      if (type === 'tv') return await tmdbService.getTVShowDetails(numericId);
      if (type === 'movie') return await tmdbService.getMovieDetails(numericId);

      try {
        const movieDetails = await tmdbService.getMovieDetails(numericId);
        if (movieDetails && movieDetails.title) return movieDetails;
        throw new Error('Not a movie');
      } catch (e) {
        return await tmdbService.getTVShowDetails(numericId);
      }
    },
<<<<<<< HEAD
    enabled: !!movieId && !supabaseContent
=======
    enabled: !!movieId && !supabaseContent && !isLoadingSupabase
>>>>>>> ff86c841179ac70f0fd4c1647154086af9f81fc5
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

  // 3. Define Direct High-Quality Servers (Hardcoded for stability)
  const staticServers = useMemo(() => {
    if (!tmdbId) return [];
    const base = isTV ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`;
    return [
      { name: 'HDHub', url: `https://vidsrc.cc/v2/embed/${base}`, tag: 'Hindi' },
      { name: 'HBOX', url: `https://hbox.vidsrc.xyz/embed/${base}`, tag: 'Hindi' },
      { name: 'HINDI', url: `https://vidsrc.in/embed/${base}`, tag: 'Hindi Only' },
      { name: 'ALICE', url: `https://vidsrc.to/embed/${base}`, tag: 'Multi' },
      { name: 'MONGO', url: `https://vidsrc.me/embed/${base}`, tag: 'Multi' },
      { name: 'NITRO', url: `https://nitro.vidsrc.xyz/embed/${base}`, tag: 'Hindi' },
    ];
  }, [tmdbId, isTV, season, episode]);

  // 4. API Integration for Bot Servers
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

        // Set default to HDHub or first API link if needed
        if (!selectedStreamUrl) {
          if (results.length > 0 && results[0].links?.length > 0) {
            setSelectedStreamUrl(results[0].links[0]);
          } else if (staticServers.length > 0) {
            setSelectedStreamUrl(staticServers[0].url);
          }
        }
      } catch (error) {
        console.error("API Error:", error);
        if (staticServers.length > 0) setSelectedStreamUrl(staticServers[0].url);
      } finally {
        setIsApiLoading(false);
      }
    };

    if (movie) fetchApiData();
  }, [movie, title, staticServers]);

  const streamServersFromApi = apiResults.filter(r =>
    r.links && r.links.length > 0 && (
      r.text.toUpperCase().includes('WATCH') ||
      r.text.toUpperCase().includes('PLAYER') ||
      r.text.toUpperCase().includes('STREAM')
    )
  );

  const downloadLinks = apiResults.filter(r =>
    r.links && r.links.length > 0 && r.text.toUpperCase().includes('PREMIUM')
  );

  const highlightKeywords = ['HINDI', 'MULTI-AUDIO', 'ALICE', 'MONGO', 'MULTI-LANG'];

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
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600">Return Home</Button></div>;

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

          {/* 1. PLAYER SECTION */}
          <section className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
              {isApiLoading && apiResults.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                  <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Searching Smart Links...</p>
                </div>
              ) : (
                <iframe
                  key={selectedStreamUrl}
                  src={selectedStreamUrl || ''}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
              )}
            </div>

            {/* SERVER GRID */}
            <div id="server-list" className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                    <Server className="w-6 h-6 text-purple-500" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-purple-200">Select Streaming Server</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Combined Static and API Servers */}
                    {staticServers.map((server, idx) => (
                        <Button
                            key={`static-${idx}`}
                            onClick={() => setSelectedStreamUrl(server.url)}
                            className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                                selectedStreamUrl === server.url
                                ? "bg-orange-600 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.4)] text-white"
                                : "bg-white/5 border-white/10 hover:border-orange-500/50 text-gray-400"
                            }`}
                        >
                            {server.name}
                        </Button>
                    ))}

                    {streamServersFromApi.map((server, idx) => {
                        const displayName = server.source?.toUpperCase() || server.text.replace(/\[.*\]/gi, '').split('-')[0].trim().toUpperCase() || `SERVER ${idx + 7}`;
                        const isSelected = selectedStreamUrl === server.links[0];
                        const isHighlighted = highlightKeywords.some(kw => displayName.includes(kw));

                        return (
                            <Button
                                key={`api-${idx}`}
                                onClick={() => setSelectedStreamUrl(server.links[0])}
                                className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                                    isSelected
                                    ? "bg-orange-600 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.4)] text-white"
                                    : (isHighlighted
                                        ? "border-orange-500/50 bg-orange-500/5 text-orange-500"
                                        : "bg-white/5 border-white/10 text-gray-400")
                                }`}
                            >
                                {displayName}
                            </Button>
                        );
                    })}
                </div>
            </div>

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
            {downloadLinks.length > 0 ? (
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
                      <span className="font-bold text-xs truncate uppercase tracking-tight">
                        {link.text.replace(/\[PREMIUM\]/gi, '').trim() || 'Direct Download'}
                      </span>
                    </a>
                  ))}
                </div>
            ) : (
                <div className="p-10 bg-white/5 rounded-[2rem] border border-white/5 text-center text-gray-500">
                    <p className="font-bold">Premium download links currently unavailable.</p>
                </div>
            )}
          </section>

          {/* 3. STORY & CAST */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-white/5">
            <div className="lg:col-span-4 space-y-6">
                <img src={posterUrl(movie)} alt={title} className="w-full rounded-[2rem] shadow-2xl border border-white/10" />
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

        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
