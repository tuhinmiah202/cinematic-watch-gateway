import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Play, User, Tv, Download, Globe, Server, Info, Maximize } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useToast } from "@/hooks/use-toast";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const movieId = id || '0';

  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string | null>(null);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleBack = () => navigate(-1);

  // 1. Fetch content from Supabase or TMDB
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-detail', movieId],
    queryFn: async () => (movieId.length === 36 ? await contentService.getContentById(movieId) : null),
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
    enabled: !!movieId && !supabaseContent
  });

  const movie = supabaseContent || tmdbContent;
  const isTV = useMemo(() => {
    if (supabaseContent) return supabaseContent.content_type === 'series';
    const type = searchParams.get('type');
    if (type) return type === 'tv';
    if (tmdbContent) return !!('name' in tmdbContent || 'first_air_date' in tmdbContent);
    return false;
  }, [supabaseContent, tmdbContent, searchParams]);

  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);

  // 2. DIRECT SERVER LINKS (Pure Template Logic, No Scrapping)
  const servers = useMemo(() => {
    if (!tmdbId) return [];
    const moviePath = `movie/${tmdbId}`;
    const tvPath = `tv/${tmdbId}/${season}/${episode}`;
    const path = isTV ? tvPath : moviePath;

    return [
      { id: 1, name: 'HINDI (VIP)', tag: 'Hindi', url: `https://vidsrc.in/embed/${path}`, color: 'bg-orange-600' },
      { id: 2, name: 'ALICE', tag: 'Multi-Lang', url: `https://vidsrc.to/embed/${path}`, color: 'bg-purple-600' },
      { id: 3, name: 'NITRO', tag: 'Hindi', url: `https://nitro.vidsrc.xyz/embed/${path}`, color: 'bg-red-600' },
      { id: 4, name: 'HBOX', tag: 'Multi-Lang', url: `https://hbox.vidsrc.xyz/embed/${path}`, color: 'bg-blue-600' },
      { id: 5, name: 'MONGO', tag: 'Multi-Lang', url: `https://vidsrc.me/embed/${isTV ? `tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}` : `movie?tmdb=${tmdbId}`}`, color: 'bg-green-600' },
      { id: 6, name: 'SEALX', tag: 'Auto', url: `https://multiembed.mov/directbot.php?video_id=${tmdbId}&tmdb=1${isTV ? `&s=${season}&e=${episode}` : ''}`, color: 'bg-yellow-600' },
    ];
  }, [tmdbId, isTV, season, episode]);

  useEffect(() => {
    if (servers.length > 0 && !selectedStreamUrl) {
      setSelectedStreamUrl(servers[0].url);
    }
  }, [servers, selectedStreamUrl]);

  const primaryGenreId = (movie as any)?.genres?.[0]?.id ?? (movie as any)?.genre_ids?.[0] ?? null;
  const { data: relatedContent = [] } = useQuery({
    queryKey: ['detail-related', tmdbId, primaryGenreId, isTV],
    queryFn: async () => {
      if (!tmdbId || !primaryGenreId) return [];
      const response = isTV ? await tmdbService.getTVShowsByGenre(Number(primaryGenreId), 1) : await tmdbService.getMoviesByGenre(Number(primaryGenreId), 1);
      return (response.results || []).filter((item: any) => item.id !== tmdbId).slice(0, 10);
    },
    enabled: !!tmdbId && !!primaryGenreId
  });

  if (isLoadingSupabase || (isLoadingTmdb && !supabaseContent)) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600">Return Home</Button></div>;

  const title = (movie as any).title || (movie as any).name;

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
        <div className="max-w-6xl mx-auto space-y-10">

          <section className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <iframe
                  key={selectedStreamUrl}
                  src={selectedStreamUrl || ''}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
            </div>

            {isTV && (
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex gap-4">
                    <Select value={season.toString()} onValueChange={(v) => { setSeason(parseInt(v)); setEpisode(1); }}>
                        <SelectTrigger className="w-32 bg-black/40 border-white/10 text-white rounded-xl"><SelectValue placeholder="S" /></SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10 text-white">
                            {[...Array(20)].map((_, i) => <SelectItem key={i+1} value={(i+1).toString()}>Season {i+1}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={episode.toString()} onValueChange={(v) => setEpisode(parseInt(v))}>
                        <SelectTrigger className="w-32 bg-black/40 border-white/10 text-white rounded-xl"><SelectValue placeholder="E" /></SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10 text-white">
                            {[...Array(50)].map((_, i) => <SelectItem key={i+1} value={(i+1).toString()}>Episode {i+1}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6">
                <div className="flex items-center gap-3">
                    <Server className="w-6 h-6 text-orange-500" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-white">Select Streaming Server</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {servers.map((server) => (
                        <Button
                            key={server.id}
                            onClick={() => {
                                setSelectedStreamUrl(server.url);
                                toast({ title: `Switching to ${server.name}`, description: "Loading video stream..." });
                            }}
                            className={`h-auto py-4 px-4 rounded-2xl transition-all border-2 flex flex-col gap-1 ${
                                selectedStreamUrl === server.url
                                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                : "bg-white/5 border-white/5 hover:border-orange-500/50 text-gray-400 hover:text-white"
                            }`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-tighter">{server.name}</span>
                            <span className={`text-[8px] font-black px-2 rounded-full ${selectedStreamUrl === server.url ? 'bg-black/10 text-black' : 'bg-orange-500/20 text-orange-500'}`}>{server.tag}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="p-6 bg-orange-600/10 border border-orange-600/20 rounded-3xl flex items-center gap-4">
                <Info className="w-6 h-6 text-orange-500 shrink-0" />
                <p className="text-xs text-orange-200 leading-relaxed font-bold uppercase tracking-wide">
                    Pro Tip: For Hindi, use HINDI (VIP) or NITRO. If it starts in English, click the Gear Icon inside the player &rarr; Audio &rarr; Hindi.
                </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3"><Download className="w-6 h-6 text-orange-500" /> Download Movie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    onClick={() => window.open(`https://vidsrc.me/download/${isTV ? `tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}` : `movie?tmdb=${tmdbId}`}`, '_blank')}
                    className="h-20 bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 rounded-3xl shadow-xl border-none transition-all hover:scale-[1.03]"
                >
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2"><Download className="w-6 h-6 text-white" /><span className="text-lg font-black italic text-white uppercase">Direct Download</span></div>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Multi-Audio / Dual-Audio</span>
                    </div>
                </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
