import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { reviewService } from '@/services/reviewService';
import { overrideService, buildEmbedUrl } from '@/services/overrideService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Clock, Play, User, Tv, Download, Globe, Server, Info, Maximize, List, AlertCircle, Languages } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useToast } from "@/hooks/use-toast";


interface ApiResult {
  text: string;
  links: string[];
}

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const movieId = id || '0';

  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string | null>(null);
  const [audioLang, setAudioLang] = useState<'hi' | 'en'>('hi');
  const [activeProvider, setActiveProvider] = useState<'admin' | 'vidsrc' | 'vidsrccc' | 'vidlink' | 'vidsrcme' | 'api'>('vidsrc');
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
          const movieDetails = await tmdbService.getMovieDetails(numericId);
          if (movieDetails && movieDetails.title) return movieDetails;
          throw new Error('Not a movie');
        } catch (e) {
          return await tmdbService.getTVShowDetails(numericId);
        }
      }
    },
    enabled: !!movieId && !supabaseContent
  });

  const movie = supabaseContent || tmdbContent;
  const isLoading = isLoadingSupabase || (isLoadingTmdb && !supabaseContent);

  const isTV = useMemo(() => {
    if (supabaseContent) return supabaseContent.content_type === 'series';
    const type = searchParams.get('type');
    if (type) return type === 'tv';
    if (tmdbContent) return !!('name' in tmdbContent || 'first_air_date' in tmdbContent);
    return false;
  }, [supabaseContent, tmdbContent, searchParams]);

  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);

  // Admin-provided Hindi stream / download links for this title
  const { data: override } = useQuery({
    queryKey: ['content-override', tmdbId, isTV],
    queryFn: () => overrideService.getOverride(tmdbId, isTV ? 'tv' : 'movie'),
    enabled: !!tmdbId
  });

  const adminHindiUrl = override?.hindi_stream_url || null;
  const adminDownloadUrl = override?.download_url || null;


  // 2. Fetch API Data on Load
  const title = (movie as any)?.title || (movie as any)?.name || 'Untitled';

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

        // Default player falls back to the first API link (admin Hindi link wins)
        if (!adminHindiUrl && results.length > 0 && results[0].links && results[0].links.length > 0) {
          setSelectedStreamUrl(results[0].links[0]);
          setActiveProvider('api');
        }
      } catch (error) {
        console.error("API Error:", error);
        setApiError('Failed to fetch servers. Please try again later.');
      } finally {
        setIsApiLoading(false);
      }
    };

    if (movie) fetchApiData();
  }, [movie, title, adminHindiUrl]);

  // Admin Hindi link takes priority as the default source
  useEffect(() => {
    if (adminHindiUrl) {
      setSelectedStreamUrl(adminHindiUrl);
      setActiveProvider('admin');
      setAudioLang('hi');
    }
  }, [adminHindiUrl]);

  // Auto-provider URL for the currently selected language
  const providerUrl = useMemo(() => {
    if (!tmdbId) return '';
    if (activeProvider === 'admin' || activeProvider === 'api') return selectedStreamUrl || '';
    return buildEmbedUrl(activeProvider, tmdbId, isTV, audioLang);
  }, [activeProvider, tmdbId, isTV, audioLang, selectedStreamUrl]);

  const playerSrc = providerUrl || selectedStreamUrl || (tmdbId ? buildEmbedUrl('vidsrc', tmdbId, isTV, audioLang) : '');

  const selectProvider = (provider: 'vidsrc' | 'vidsrccc' | 'vidlink' | 'vidsrcme') => {
    setActiveProvider(provider);
    setSelectedStreamUrl(null);
  };


  // Derived sections from API results
  const streamServers = apiResults.filter(r =>
    !r.text.toLowerCase().includes('details') &&
    !r.text.toLowerCase().includes('download')
  );

  const downloadLinks = apiResults.filter(r =>
    r.text.toLowerCase().includes('details') ||
    r.text.toLowerCase().includes('download')
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
          <section className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
              {isApiLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                  <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Loading premium servers...</p>
                </div>
              ) : (
                <iframe
                  id="movie-player"
                  key={playerSrc}
                  src={playerSrc}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
              )}
            </div>

            {/* AUDIO LANGUAGE SWITCH */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <Languages className="w-6 h-6 text-red-600" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter text-white">Audio Language</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    Hindi select korle server hindi audio niye load hobe
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    setAudioLang('hi');
                    if (adminHindiUrl) {
                      setSelectedStreamUrl(adminHindiUrl);
                      setActiveProvider('admin');
                    } else if (activeProvider === 'api') {
                      setActiveProvider('vidsrc');
                      setSelectedStreamUrl(null);
                    }
                  }}
                  className={`rounded-2xl px-6 py-5 text-xs font-black uppercase border-2 ${
                    audioLang === 'hi'
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  हिंदी / Hindi
                </Button>
                <Button
                  onClick={() => {
                    setAudioLang('en');
                    if (activeProvider === 'admin' || activeProvider === 'api') {
                      setActiveProvider('vidsrc');
                      setSelectedStreamUrl(null);
                    }
                  }}
                  className={`rounded-2xl px-6 py-5 text-xs font-black uppercase border-2 ${
                    audioLang === 'en'
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  English
                </Button>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                {adminHindiUrl
                  ? 'Verified Hindi source available for this title.'
                  : 'Tip: player er vitor Settings (gear) → Audio → Hindi theke o audio track change kora jay.'}
              </p>
            </div>

            {/* SERVER SELECTION GRID */}
            <div id="server-list" className="space-y-4 bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <Server className="w-6 h-6 text-red-600" />
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Select Server</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Switch to high-speed servers if player fails</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {adminHindiUrl && (
                      <Button
                        onClick={() => {
                          setSelectedStreamUrl(adminHindiUrl);
                          setActiveProvider('admin');
                          setAudioLang('hi');
                        }}
                        className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                          activeProvider === 'admin'
                            ? 'bg-green-600 border-green-500 shadow-[0_0_20px_rgba(22,163,74,0.4)] text-white'
                            : 'bg-white/5 border-white/10 hover:border-green-500/50 text-gray-400 hover:text-white'
                        }`}
                      >
                        Hindi Server
                      </Button>
                    )}

                    {([
                      { key: 'vidsrc', label: 'Server 1' },
                      { key: 'vidsrccc', label: 'Server 2' },
                      { key: 'vidlink', label: 'Server 3' },
                      { key: 'vidsrcme', label: 'Server 4' }
                    ] as const).map((s) => (
                      <Button
                        key={s.key}
                        onClick={() => selectProvider(s.key)}
                        className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                          activeProvider === s.key
                            ? 'bg-red-600 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] text-white'
                            : 'bg-white/5 border-white/10 hover:border-red-500/50 text-gray-400 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </Button>
                    ))}

                    {/* API Generated Buttons */}
                    {streamServers.map((server, idx) => (
                        <Button
                            key={idx}
                            onClick={() => {
                                setSelectedStreamUrl(server.links[0]);
                                setActiveProvider('api');
                                toast({ title: "Switching Server", description: `Loading ${server.text.split(' ')[0]}...` });
                            }}
                            className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black transition-all uppercase border-2 ${
                                activeProvider === 'api' && selectedStreamUrl === server.links[0]
                                ? "bg-red-600 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] text-white"
                                : "bg-white/5 border-white/10 hover:border-red-500/50 text-gray-400 hover:text-white"
                            }`}
                        >
                            {server.text.split('-')[0].trim() || `SERVER ${idx + 5}`}
                        </Button>
                    ))}
                </div>
            </div>
          </section>

          {/* 2. DOWNLOAD CENTER */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-red-600 pl-4">
               <Download className="w-6 h-6 text-red-600" />
               <h2 className="text-2xl font-black uppercase tracking-tighter">Download Links</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminDownloadUrl && (
                <a
                  href={adminDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-20 bg-gradient-to-br from-green-600 to-emerald-800 hover:from-green-500 hover:to-emerald-700 rounded-3xl shadow-xl border-none transition-all hover:scale-[1.03] no-underline flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-2"><Download className="w-5 h-5 text-white" /><span className="text-sm font-black italic text-white uppercase">Direct Download</span></div>
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Verified Link</span>
                </a>
              )}

              {downloadLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.links[0]}
                  target="_blank"
                  rel="noreferrer"
                  className="h-20 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 rounded-3xl shadow-xl border-none transition-all hover:scale-[1.03] group no-underline flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-2"><Download className="w-5 h-5 text-white" /><span className="text-sm font-black italic text-white uppercase">Download Link {idx + 1}</span></div>
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{link.text.split('-')[0].trim()}</span>
                </a>
              ))}

              {/* No links available */}
              {!adminDownloadUrl && downloadLinks.length === 0 && !isApiLoading && (
                <div className="h-20 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center text-center px-4">
                  <span className="text-sm font-black uppercase text-gray-400">No download link yet</span>
                  <span className="text-[10px] text-gray-500 font-bold">Admin shongjukto korle ekhane dekhabe</span>
                </div>
              )}
            </div>

          </section>

          {/* 3. STORY & INFO */}
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
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-red-600">Storyline</h2>
                    <p className="text-gray-400 leading-relaxed text-lg font-light">{(movie as any).overview}</p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white font-black uppercase"><User className="w-5 h-5 text-red-600" /> Top Cast</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tmdbCast?.slice(0, 4).map((actor: any) => (
                            <div key={actor.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center transition-all hover:bg-white/10">
                                <h4 className="text-xs font-bold truncate">{actor.name}</h4>
                                <p className="text-[9px] text-gray-500 truncate uppercase tracking-widest">{actor.character}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          <div className="pt-20">
            <h2 className="text-2xl font-black flex items-center gap-3 uppercase italic text-red-600"><span className="w-2 h-8 bg-red-600 rounded-full"></span> More Like This</h2>
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
