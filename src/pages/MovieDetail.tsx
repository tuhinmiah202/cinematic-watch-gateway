import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Play, User, Tv, Download, Globe, Server, Info, Maximize, List, CheckCircle2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const movieId = id || '0';

  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string | null>(null);
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
  const imdbId = (movie as any)?.imdb_id || (movie as any)?.external_ids?.imdb_id;

  // Fetch External IDs for IMDB ID (Crucial for Hindi Content)
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

  // 2. Optimized Premium Servers (Focusing on vidsrc.to and multiembed for Hindi)
  const servers = useMemo(() => {
    if (!tmdbId) return [];

    const idParam = finalImdbId || tmdbId;
    const moviePath = `movie/${idParam}`;
    const tvPath = `tv/${idParam}/${season}/${episode}`;
    const path = isTV ? tvPath : moviePath;

    return [
      { id: 1, name: 'ALICE (Stable)', tag: 'Multi-Lang', url: `https://vidsrc.to/embed/${path}`, type: 'multi' },
      { id: 2, name: 'HINDI (Auto)', tag: 'Hindi Dubbed', url: `https://autoembed.co/${isTV ? 'tv' : 'movie'}/tmdb/${tmdbId}${isTV ? `?s=${season}&e=${episode}` : ''}`, type: 'hindi' },
      { id: 3, name: 'HBOX (Fast)', tag: 'Multi-Audio', url: `https://multiembed.mov/directbot.php?video_id=${idParam}&tmdb=1${isTV ? `&s=${season}&e=${episode}` : ''}`, type: 'multi' },
      { id: 4, name: 'SEALX', tag: 'Hindi Focus', url: `https://multiembed.cm/directbot.php?video_id=${idParam}&tmdb=1${isTV ? `&s=${season}&e=${episode}` : ''}`, type: 'hindi' },
      { id: 5, name: 'MONGO', tag: 'High Speed', url: `https://vidsrc.me/embed/${isTV ? `tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}` : `movie?tmdb=${tmdbId}`}`, type: 'multi' },
      { id: 6, name: 'SERVER 2', tag: 'Alternative', url: `https://www.2embed.cc/embed/${isTV ? `tv?tmdb=${tmdbId}&s=${season}&e=${episode}` : `movie?tmdb=${tmdbId}`}`, type: 'multi' },
    ];
  }, [tmdbId, isTV, season, episode, finalImdbId]);

  useEffect(() => {
    if (servers.length > 0 && !selectedStreamUrl) {
      setSelectedStreamUrl(servers[0].url);
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

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"><div className="text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 text-white">Return Home</Button></div></div>;

  const title = (movie as any).title || (movie as any).name;
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

          {/* 1. PLAYER AREA */}
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

            {/* SERVER SELECTION GRID */}
            <div className="space-y-4 bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <Server className="w-6 h-6 text-orange-500" />
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Choose Server</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Select HINDI (Auto) or HBOX for dubbed versions</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {servers.map((server) => (
                        <Button
                            key={server.id}
                            onClick={() => {
                                setSelectedStreamUrl(server.url);
                                toast({ title: `Switching to ${server.name}`, description: "Refreshing video player..." });
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

            {/* HINDI AUDIO GUIDE */}
            <div className="p-6 bg-orange-600/10 border border-orange-600/20 rounded-3xl flex items-center gap-4">
                <Info className="w-6 h-6 text-orange-500 shrink-0" />
                <div className="text-xs space-y-1">
                    <p className="text-orange-200 font-bold uppercase tracking-wider">How to enable Hindi Audio:</p>
                    <p className="text-orange-200/80 leading-relaxed">
                        ১. হলিউড মুভির জন্য <b>HINDI (Auto)</b> অথবা <b>HBOX</b> সার্ভার সবচেয়ে ভালো।
                        <br />২. ভিডিও লোড হওয়ার পর ভেতরে থাকা <b>Settings (Gear icon)</b> এ ক্লিক করে <b>Audio</b> থেকে <b>Hindi</b> সিলেক্ট করুন।
                    </p>
                </div>
            </div>
          </section>

          {/* 2. DOWNLOAD CENTER */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3"><Download className="w-6 h-6 text-orange-500" /> Download Movie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    onClick={() => window.open(`https://vidsrc.me/download/${isTV ? `tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}` : `movie?tmdb=${tmdbId}`}`, '_blank')}
                    className="h-20 bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 rounded-3xl shadow-xl border-none transition-all hover:scale-[1.03]"
                >
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2"><Download className="w-6 h-6 text-white" /><span className="text-lg font-black italic text-white uppercase">Direct Download</span></div>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Multi-Audio / Dual-Audio Support</span>
                    </div>
                </Button>
                <Button
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(title + ' hindi dubbed download dual audio torrent')}`, '_blank')}
                    className="h-20 bg-white/5 hover:bg-white/10 rounded-3xl shadow-xl border border-white/10 transition-all hover:scale-[1.03]"
                >
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2"><Globe className="w-6 h-6 text-white" /><span className="text-lg font-black italic text-white uppercase">Torrent Download</span></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">High-Speed Magnet Links</span>
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
