import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Play, User, Download, Server, Info, ShieldCheck, List, Tv, Globe, Box } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const contentTypeParam = searchParams.get('type');

  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<ApiResult[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // TV Show States
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleBack = () => navigate(-1);

  // 1. Fetch content from TMDB/Supabase
  const { data: movie, isLoading } = useQuery({
    queryKey: ['content-detail', movieId, contentTypeParam],
    queryFn: async () => {
      if (movieId.length === 36) return await contentService.getContentById(movieId);
      const numericId = parseInt(movieId);
      if (contentTypeParam === 'tv') return await tmdbService.getTVShowDetails(numericId);
      if (contentTypeParam === 'movie') return await tmdbService.getMovieDetails(numericId);
      try {
        const details = await tmdbService.getMovieDetails(numericId);
        if (details && (details as any).title) return details;
        throw new Error();
      } catch (e) {
        return await tmdbService.getTVShowDetails(numericId);
      }
    },
    enabled: !!movieId
  });

  const isTV = useMemo(() => {
    if (contentTypeParam === 'tv') return true;
    if (contentTypeParam === 'movie') return false;
    return !!(movie && ('name' in movie || 'first_air_date' in movie));
  }, [movie, contentTypeParam]);

  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);
  const title = (movie as any)?.title || (movie as any)?.name || 'Untitled';

<<<<<<< HEAD
  // 2. Fetch from Custom Movie API on load (Requirement)
=======
  // Related content ("More Like This")
  const { data: relatedData } = useQuery({
    queryKey: ['related-content', tmdbId, isTV],
    queryFn: async () => {
      if (!tmdbId) return { results: [] };
      return isTV
        ? await tmdbService.getTVShowRecommendations(tmdbId)
        : await tmdbService.getMovieRecommendations(tmdbId);
    },
    enabled: !!tmdbId,
  });
  const relatedContent = (relatedData?.results || []).slice(0, 12);

  // 2. Verified High-Speed Servers (Optimized for Hindi)
  const servers = useMemo(() => {
    if (!tmdbId) return [];

    const moviePath = `movie/${tmdbId}`;
    const tvPath = `tv/${tmdbId}/${season}/${episode}`;
    const path = isTV ? tvPath : moviePath;

    return [
      { id: 'hdhub', name: 'SERVER: HINDI (VIP)', url: `https://vidsrc.cc/v2/embed/${path}`, tag: 'Dual-Audio' },
      { id: 'hindi-vip', name: 'SERVER: HINDI (2)', url: `https://vidsrc.in/embed/${path}`, tag: 'Hindi' },
      { id: '2embed', name: 'SERVER: 2EMBED', url: `https://www.2embed.cc/embed/${isTV ? `${tmdbId}/${season}/${episode}` : tmdbId}`, tag: 'Multi' },
      { id: 'hnembed', name: 'SERVER: HNEMBED', url: `https://hnembed.cc/embed/${isTV ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`}`, tag: 'New' },
      { id: 'vidsrc-to', name: 'SERVER: VIDSRC.TO', url: `https://vidsrc.to/embed/${path}`, tag: 'Fast' },
      { id: 'vidsrc-me', name: 'SERVER: VIDSRC.ME', url: `https://vidsrc.me/embed/${isTV ? `tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}` : `movie?tmdb=${tmdbId}`}`, tag: 'Global' },
    ];
  }, [tmdbId, isTV, season, episode]);

  useEffect(() => {
    if (servers.length > 0) {
      if (!selectedStreamUrl) {
        setSelectedStreamUrl(servers[0].url);
      } else {
        // Find if current server is still in the list and update its URL (for season/episode changes)
        const currentServer = servers.find(s => s.id === servers.find(sv => sv.url === selectedStreamUrl)?.id);
        if (currentServer) setSelectedStreamUrl(currentServer.url);
      }
    }
  }, [servers]);

  // 3. Bot/Telegram API Results
>>>>>>> caa81aaf6d98ff23b018e5ccf360080eefe493a1
  useEffect(() => {
    const fetchApiData = async () => {
      if (!title || title === 'Untitled') return;
      const cleanTitle = title.replace(/\(\d{4}\)/g, '').replace(/[^\w\s]/gi, ' ').trim();
      setIsApiLoading(true);
      try {
        const response = await fetch(`https://web-production-69ea9.up.railway.app/get-telegram-movie?name=${encodeURIComponent(cleanTitle)}`);
        const data = await response.json();
        const results = Array.isArray(data.results) ? data.results : [];
        setApiResults(results);

        // Auto-Load Default Player: set src to first link in API results
        if (results.length > 0 && results[0].links && results[0].links.length > 0) {
          setSelectedStreamUrl(results[0].links[0]);
        }
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setIsApiLoading(false);
      }
    };
    if (movie) fetchApiData();
  }, [movie, title]);

  // 3. Static Servers
  const servers = useMemo(() => {
    if (!tmdbId) return [];
    const moviePath = `movie/${tmdbId}`;
    const tvPath = `tv/${tmdbId}/${season}/${episode}`;
    const path = isTV ? tvPath : moviePath;

    return [
      { id: 'hdhub', name: 'HINDI: HDHUB', url: `https://vidsrc.cc/v2/embed/${path}`, tag: 'Dual-Audio' },
      { id: 'hindi-vip', name: 'HINDI: VIP (Best)', url: `https://vidsrc.in/embed/${path}`, tag: 'Hindi' },
      { id: '2embed', name: 'SERVER: 2EMBED', url: `https://www.2embed.cc/embed/${isTV ? `${tmdbId}/${season}/${episode}` : tmdbId}`, tag: 'Multi' },
      { id: 'vidsrc-to', name: 'SERVER: VIDSRC.TO', url: `https://vidsrc.to/embed/${path}`, tag: 'Fast' },
    ];
  }, [tmdbId, isTV, season, episode]);

  // Set default if API fails or hasn't loaded yet
  useEffect(() => {
    if (!selectedStreamUrl && servers.length > 0) {
      setSelectedStreamUrl(servers[0].url);
    }
  }, [servers, selectedStreamUrl]);

  const getDownloadUrl = () => {
    if (isTV) return `https://vidsrc.me/download/tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}`;
    return `https://vidsrc.me/download/movie?tmdb=${tmdbId}`;
  };

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-red-500" /></div>;
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600">Return Home</Button></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Navbar */}
      <div className="bg-black/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="hover:bg-white/10"><ArrowLeft className="w-5 h-5 mr-2" /> Back</Button>
          <h1 className="text-sm font-black truncate max-w-[200px] md:max-w-md uppercase tracking-tighter">{title}</h1>
          <div className="px-3 py-1 bg-red-600 rounded-full text-[10px] font-black animate-pulse">{isTV ? 'SERIES' : 'MOVIE'}</div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* 1. PLAYER SECTION */}
          <section className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
                {isApiLoading && apiResults.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20">
                    <Loader2 className="h-10 w-10 animate-spin text-red-600 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Searching for Hindi Servers...</p>
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
                  ></iframe>
                )}
            </div>

            {/* TV SERIES SELECTOR */}
            {isTV && (
                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-3 shrink-0">
                        <Tv className="w-6 h-6 text-red-600" />
                        <span className="font-bold uppercase tracking-tighter">Episode Selector</span>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-32">
                            <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block ml-1">Season</label>
                            <Select value={season.toString()} onValueChange={(v) => { setSeason(parseInt(v)); setEpisode(1); }}>
                                <SelectTrigger className="w-full bg-black/40 border-white/10 rounded-xl h-12 text-xs">
                                    <SelectValue placeholder="S1" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    {[...Array(20)].map((_, i) => <SelectItem key={i+1} value={(i+1).toString()}>Season {i+1}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 md:w-32">
                            <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block ml-1">Episode</label>
                            <Select value={episode.toString()} onValueChange={(v) => setEpisode(parseInt(v))}>
                                <SelectTrigger className="w-full bg-black/40 border-white/10 rounded-xl h-12 text-xs">
                                    <SelectValue placeholder="E1" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    {[...Array(50)].map((_, i) => <SelectItem key={i+1} value={(i+1).toString()}>Episode {i+1}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {/* SERVER SELECTION */}
            <div className="bg-zinc-900/30 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                    <Server className="w-6 h-6 text-red-600" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-white">Select High-Speed Server</h2>
                </div>

                <div id="server-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {/* MOVIEBOX BUTTON (Requirement) */}
                    <Button
                        onClick={() => {
                          if (apiResults.length > 0) setSelectedStreamUrl(apiResults[0].links[0]);
                          else toast({ title: "Moviebox Fetching...", description: "Please wait or try again." });
                        }}
                        className={`h-auto py-5 px-4 rounded-2xl text-[10px] font-black transition-all border-2 uppercase flex flex-col gap-1 ${
                            selectedStreamUrl === apiResults[0]?.links[0]
                            ? "bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.4)] text-white"
                            : "bg-purple-600/10 border-purple-600/30 text-purple-400 hover:bg-purple-600 hover:text-white"
                        }`}
                    >
                        <Box className="w-4 h-4 mb-1" />
                        <span>SERVER: MOVIEBOX</span>
                        <span className="text-[8px] opacity-70">[VIP Details]</span>
                    </Button>

                    {servers.map((server) => (
                        <Button
                            key={server.id}
                            onClick={() => setSelectedStreamUrl(server.url)}
                            className={`h-auto py-5 px-4 rounded-2xl text-[10px] font-black transition-all border-2 uppercase flex flex-col gap-1 ${
                                selectedStreamUrl === server.url
                                ? "bg-red-600 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] text-white"
                                : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                            }`}
                        >
                            <span>{server.name}</span>
                            <span className={`text-[8px] px-2 rounded-full ${selectedStreamUrl === server.url ? 'bg-white/20' : 'bg-red-600/20 text-red-500'}`}>[{server.tag}]</span>
                        </Button>
                    ))}

                    {/* Bot Dynamic Servers */}
                    {apiResults.slice(1, 4).map((bot, idx) => (
                        <Button
                            key={`bot-${idx}`}
                            onClick={() => setSelectedStreamUrl(bot.links[0])}
                            className={`h-auto py-5 px-4 rounded-2xl text-[10px] font-black transition-all border-2 uppercase ${
                                selectedStreamUrl === bot.links[0]
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-white/5 border-white/5 text-zinc-500"
                            }`}
                        >
                            {bot.source || `SERVER ${idx + 5}`}
                        </Button>
                    ))}
                </div>
            </div>

            {/* TIPS & HELP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 px-6 py-4 bg-zinc-900/50 border border-white/10 rounded-3xl">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <p className="text-[11px] text-zinc-400 font-medium">
                        <b>No Ads?</b> Use <b>Brave Browser</b> or an <b>Ad-Blocker</b> for a smooth experience.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 bg-orange-600/10 border border-orange-600/20 rounded-3xl">
                    <Info className="w-5 h-5 text-orange-500" />
                    <p className="text-[11px] text-orange-200 font-medium">
                        <b>Hindi Audio:</b> Select <b>MOVIEBOX</b> or <b>HINDI (VIP)</b>. Check Gear settings for Audio.
                    </p>
                </div>
            </div>
          </section>

          {/* 2. DOWNLOAD CENTER */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-red-600 pl-4">
                <Download className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Download Center</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    onClick={() => window.open(getDownloadUrl(), '_blank')}
                    className="h-20 bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 rounded-3xl shadow-xl border-none transition-all hover:scale-[1.02] group text-white"
                >
                    <Download className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                    <div className="flex flex-col items-start">
                        <span className="text-lg font-black italic uppercase leading-none">Fast Download</span>
                        <span className="text-[10px] font-bold uppercase opacity-70 tracking-widest mt-1">Multi-Audio / 1080p HD</span>
                    </div>
                </Button>
                <Button
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(title)} download hindi dubbed 1080p`, '_blank')}
                    className="h-20 bg-zinc-800 hover:bg-zinc-700 rounded-3xl border border-white/5 transition-all flex items-center justify-center gap-3"
                >
                    <Globe className="w-6 h-6 text-zinc-500" />
                    <span className="text-sm font-black uppercase text-zinc-400">Search Mirror Links</span>
                </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
