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

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // 2. Verified Active Servers (Hindi & Multi)
  const servers = useMemo(() => {
    if (!tmdbId) return [];
    const moviePath = `movie/${tmdbId}`;
    const tvPath = `tv/${tmdbId}/${season}/${episode}`;
    const path = isTV ? tvPath : moviePath;

    return [
      { id: 1, name: 'SERVER: HINDI (VIP)', url: `https://vidsrc.in/embed/${path}`, type: 'hindi' },
      { id: 2, name: 'SERVER: HD (MULTI)', url: `https://vidsrc.to/embed/${path}`, type: 'multi' },
      { id: 3, name: 'SERVER: 2EMBED', url: `https://www.2embed.cc/embed/${isTV ? tmdbId : tmdbId}`, type: 'multi' },
      { id: 4, name: 'SERVER: Vidsrc.me', url: `https://vidsrc.me/embed/${isTV ? `tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}` : `movie?tmdb=${tmdbId}`}`, type: 'global' },
      { id: 5, name: 'SERVER: Smashy', url: `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}${isTV ? `&season=${season}&episode=${episode}` : ''}`, type: 'alt' },
      { id: 6, name: 'SERVER: SuperEmbed', url: `https://multiembed.mov/directbot.php?video_id=${tmdbId}&tmdb=1${isTV ? `&s=${season}&e=${episode}` : ''}`, type: 'bot' },
    ];
  }, [tmdbId, isTV, season, episode]);

  // Set default server
  useEffect(() => {
    if (servers.length > 0 && !selectedStreamUrl) {
      setSelectedStreamUrl(servers[0].url);
    }
  }, [servers, selectedStreamUrl]);

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

          {/* 1. VIDEO PLAYER SECTION */}
          <section className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
                <iframe
                  key={selectedStreamUrl} // THIS FORCES THE FRAME TO REFRESH ON CHANGE
                  src={selectedStreamUrl || ''}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
            </div>

            {/* SERVER SELECTION GRID */}
            <div className="space-y-4 bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                    <Server className="w-6 h-6 text-orange-500" />
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Select Fast Server</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Click a server below to change the video player</p>
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

            {/* HINDI AUDIO GUIDE */}
            <div className="p-6 bg-gradient-to-r from-orange-600/20 to-transparent border border-orange-600/30 rounded-[2rem] flex items-center gap-4">
                <Info className="w-8 h-8 text-orange-500 shrink-0" />
                <div>
                    <h3 className="text-sm font-black uppercase text-white">How to get Hindi Audio?</h3>
                    <p className="text-xs text-orange-200/80 leading-relaxed">
                        If the movie starts in English, click the <b>Settings (Gear icon)</b> inside the player &rarr; <b>Audio</b> &rarr; <b>Hindi</b>.
                        Try <b>SERVER: HINDI (VIP)</b> or <b>SERVER: 2EMBED</b> for best results.
                    </p>
                </div>
            </div>
          </section>

          {/* 2. STORY & INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-white/5">
            <div className="lg:col-span-4 space-y-6">
                <img src={posterUrl(movie)} alt={title} className="w-full rounded-[2rem] shadow-2xl border border-white/10" />
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">TMDB Rating</span>
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold">{(movie as any).vote_average?.toFixed(1)}</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Release Year</span>
                        <span className="font-bold">{(movie as any).release_date?.split('-')[0] || (movie as any).first_air_date?.split('-')[0] || 'N/A'}</span>
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
                                <p className="text-[9px] text-gray-500 truncate uppercase tracking-widest">{actor.character}</p>
                            </div>
                        ))}
                    </div>
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
