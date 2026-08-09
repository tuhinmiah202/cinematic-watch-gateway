import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Play, User, Download, Globe, Server, Info, Maximize, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
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
  const [isTorrentLoading, setIsTorrentLoading] = useState(false);

  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleBack = () => navigate(-1);

  // 1. Fetch content (Existing Logic)
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
  const imdbId = (movie as any)?.imdb_id || (movie as any)?.external_ids?.imdb_id;

  const { data: externalIds } = useQuery({
    queryKey: ['external-ids', tmdbId],
    queryFn: async () => {
      const url = `https://api.themoviedb.org/3/${isTV ? 'tv' : 'movie'}/${tmdbId}/external_ids?api_key=566149bf98e53cc39a4c04bfe01c03fc`;
      const res = await fetch(url);
      return res.json();
    },
    enabled: !!tmdbId && !imdbId
  });

  const finalImdbId = imdbId || externalIds?.imdb_id;

  // 2. Verified FAST Servers
  const staticServers = useMemo(() => {
    if (!tmdbId) return [];
    const base = isTV ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`;
    return [
      { name: 'SERVER 1 (Fast)', url: `https://vidsrc.to/embed/${base}`, tag: 'Instant' },
      { name: 'SERVER 2 (Hindi)', url: `https://vidsrc.cc/v2/embed/${base}`, tag: 'Multi' },
      { name: 'HINDI: VIP', url: `https://vidsrc.in/embed/${base}`, tag: 'Dual' },
      { name: '2EMBED', url: `https://www.2embed.cc/embed/${isTV ? `tv?tmdb=${tmdbId}&s=${season}&e=${episode}` : `movie?tmdb=${tmdbId}`}`, tag: 'Mirror' },
    ];
  }, [tmdbId, isTV, season, episode]);

  // Default Player Logic: Fast Server First
  useEffect(() => {
    if (staticServers.length > 0 && !selectedStreamUrl) {
      setSelectedStreamUrl(staticServers[0].url);
    }
  }, [staticServers, selectedStreamUrl]);

  // 3. Optimized Torrent Logic (Small Size + High Speed)
  const handleTorrentServer = async () => {
    if (!finalImdbId) {
      toast({ title: "Server Busy", description: "Try Server 1 or 2.", variant: "destructive" });
      return;
    }
    setIsTorrentLoading(true);
    try {
      const res = await fetch(`https://torrentio.strem.fun/stream/${isTV ? 'series' : 'movie'}/${finalImdbId}${isTV ? `:${season}:${episode}` : ''}.json`);
      const data = await res.json();

      // Speed-Focused Filtering: Priority 720p Hindi
      let streams = data.streams || [];
      let best = streams.find((s: any) => /hindi|dual/i.test(s.title) && /720p/i.test(s.title)) ||
                 streams.find((s: any) => /hindi|dual/i.test(s.title)) ||
                 streams[0];

      if (!best) throw new Error();

      const webtorUrl = `https://webtor.io/show?magnet=${encodeURIComponent(`magnet:?xt=urn:btih:${best.infoHash}`)}&theme=dark&color=e50914`;
      setSelectedStreamUrl(webtorUrl);
      toast({ title: "Buffering Optimized", description: "Loading mobile-friendly stream..." });
    } catch (e) {
      toast({ title: "Server Down", description: "Please use Server 1.", variant: "destructive" });
    } finally {
      setIsTorrentLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-red-500" /></div>;

  const title = (movie as any)?.title || (movie as any)?.name || 'Untitled';

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
        <div className="max-w-5xl mx-auto space-y-8">

          {/* PLAYER SECTION */}
          <section className="space-y-4">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
              {isTorrentLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-20">
                  <Loader2 className="h-10 w-10 animate-spin text-red-600 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Optimizing for your network...</p>
                </div>
              ) : (
                <iframe
                  key={selectedStreamUrl}
                  src={selectedStreamUrl || ''}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture"
                ></iframe>
              )}
            </div>

            {/* SERVER SELECTION */}
            <div className="bg-zinc-900/50 p-5 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Server className="w-5 h-5 text-red-500" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Select Instant Server</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {staticServers.map((server, idx) => (
                        <Button
                            key={idx}
                            onClick={() => setSelectedStreamUrl(server.url)}
                            className={`h-auto py-4 px-3 rounded-2xl text-[10px] font-black transition-all border-2 ${
                                selectedStreamUrl === server.url
                                ? "bg-red-600 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)] text-white"
                                : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                            }`}
                        >
                            {server.name}
                        </Button>
                    ))}
                    <Button
                        onClick={handleTorrentServer}
                        className={`h-auto py-4 px-3 rounded-2xl text-[10px] font-black transition-all border-2 ${
                            selectedStreamUrl?.includes('webtor.io')
                            ? "bg-orange-600 border-orange-500 text-white"
                            : "bg-orange-600/10 border-orange-600/20 text-orange-500 hover:bg-orange-600/20"
                        }`}
                    >
                        <Zap className="w-3 h-3 mr-1 fill-current" /> HINDI: VIP
                    </Button>
                </div>
            </div>

            {/* GUIDE */}
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 border border-blue-600/20 rounded-2xl">
                <Info className="w-4 h-4 text-blue-500" />
                <p className="text-[11px] text-blue-200 font-medium">
                    <b>No Sound?</b> Switch to <b>SERVER 1</b>. For <b>Hindi</b>, click the Gear icon ⚙️ inside the player.
                </p>
            </div>
          </section>

          {/* DOWNLOAD & INFO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
                <img src={`https://image.tmdb.org/t/p/w500${(movie as any).poster_path}`} className="w-full rounded-3xl shadow-2xl border border-white/5" alt="" />
            </div>
            <div className="md:col-span-8 space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                           {(movie as any).release_date?.split('-')[0] || '2024'}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500">
                           <Star className="w-4 h-4 fill-current" />
                           <span className="font-black text-sm">{(movie as any).vote_average?.toFixed(1)}</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">The Overview</h2>
                    <p className="text-zinc-500 text-sm leading-relaxed">{(movie as any).overview}</p>
                </div>

                <div className="pt-4 space-y-4">
                    <h3 className="text-sm font-black uppercase text-zinc-400 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-500" /> Secure Download
                    </h3>
                    <Button
                        onClick={() => window.open(`https://vidsrc.me/download/${isTV ? 'tv' : 'movie'}?tmdb=${tmdbId}`, '_blank')}
                        className="w-full h-16 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-red-600 hover:to-red-700 rounded-2xl border border-white/5 transition-all group"
                    >
                        <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                        <span className="font-black uppercase tracking-widest text-xs">Download in Hindi / HD</span>
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
