import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { reviewService } from '@/services/reviewService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Clock, Play, User, Tv, Download, Globe, Server, Info, Maximize, CheckCircle2 } from 'lucide-react';
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

  const [selectedServer, setSelectedServer] = useState('default');
  const [railwayLinks, setRailwayLinks] = useState<string[]>([]);
  const [mirrorLinks, setMirrorLinks] = useState<string[]>([]);
  const [telegramStream, setTelegramStream] = useState<string | null>(null);
  const [ultraStream, setUltraStream] = useState<string | null>(null);
  const [isRailwayLoading, setIsRailwayLoading] = useState(false);
  const [isMirrorLoading, setIsMirrorLoading] = useState(true);
  const [countdown, setCountdown] = useState(40);

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

  // Helper: Clean movie name for better API matching
  const cleanMovieName = (name: string) => {
    return name
      .replace(/\(\d{4}\)/g, '') // Remove (2024)
      .replace(/\[.*\]/g, '')     // Remove [Hindi]
      .replace(/[^\w\s]/gi, '')   // Remove special characters
      .trim();
  };

  // 3. Custom Movie API Integration (Telegram/Railway)
  useEffect(() => {
    const fetchCustomApiData = async () => {
      const movieTitle = (movie as any)?.title || (movie as any)?.name;
      if (!movieTitle) return;

      const query = cleanMovieName(movieTitle);
      setIsRailwayLoading(true);

      try {
        const response = await fetch(`https://pythonmovie-bot1-production.up.railway.app/get-telegram-movie?name=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        // --- 1. Handle standard_results ---
        const standardResults = data.standard_results || [];
        const results = Array.isArray(standardResults) ? standardResults : (standardResults.results || []);
        
        // Directly load results[0].stream_provider into iframe
        if (results.length > 0 && results[0].stream_provider) {
          setTelegramStream(results[0].stream_provider);
          setSelectedServer('telegram');
        } else {
          // Fallback search
          const responseText = JSON.stringify(standardResults);
          const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
          const allLinks = responseText.match(urlRegex) || [];

          const movieLinkBd = allLinks.find(url => url.includes('movielinkbd'));
          const movieBox = allLinks.find(url => url.includes('themoviebox'));

          if (movieLinkBd) {
            setTelegramStream(movieLinkBd);
            setSelectedServer('telegram');
          } else if (movieBox) {
            setTelegramStream(movieBox);
            setSelectedServer('telegram');
          }
        }

        // Standard Download Links (Prioritize Drive/Mega/Pixeldrain)
        const responseTextStd = JSON.stringify(standardResults);
        const urlRegexStd = /(https?:\/\/[^\s"'<>]+)/g;
        const allFoundLinksStd = responseTextStd.match(urlRegexStd) || [];

        const priorityStd = allFoundLinksStd.filter(url =>
          url.includes('drive.google.com') ||
          url.includes('mega.nz') ||
          url.includes('pixeldrain.com')
        );

        const otherStd = allFoundLinksStd.filter(url =>
          !url.includes('api.themoviedb.org') &&
          !url.includes('tmdb.org') &&
          !url.includes('railway.app') &&
          !url.includes('movielinkbd') &&
          !url.includes('themoviebox') &&
          !priorityStd.includes(url)
        );

        setRailwayLinks([...priorityStd, ...otherStd]);

        // --- 2. Handle mirror_results (Premium) ---
        const mirrorResults = data.mirror_results || [];
        if (mirrorResults.length > 0) {
           setMirrorLinks(mirrorResults);
           setIsMirrorLoading(false);
           if (mirrorResults[0]) {
              setUltraStream(mirrorResults[0]);
              setSelectedServer('ultra'); // Priority 1 for streaming
           }
        }

      } catch (error) {
        console.error("Custom API Error:", error);
      } finally {
        setIsRailwayLoading(false);
      }
    };

    if (movie) fetchCustomApiData();
  }, [movie]);

  // Countdown timer for Mirror Bot
  useEffect(() => {
    if (countdown > 0 && isMirrorLoading) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setIsMirrorLoading(false);
    }
  }, [countdown, isMirrorLoading]);

  const getEmbedUrl = () => {
    if (selectedServer === 'ultra' && ultraStream) return ultraStream;
    if (selectedServer === 'telegram' && telegramStream) return telegramStream;
    
    const videoId = finalImdbId || tmdbId;
    return `https://multiembed.mov/directstream.php?video_id=${videoId}&tmdb=1${isTV ? '&s=1&e=1' : ''}`;
  };

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

          {/* 1. TOP PLAYER SECTION */}
          <section id="player-container" className="space-y-4">
            <div className="relative w-full aspect-video bg-[#050505] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
              {isRailwayLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                  <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Scanning Smart Sources...</p>
                </div>
              ) : !getEmbedUrl() && !isRailwayLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 text-white font-bold">
                   Streaming currently unavailable
                </div>
              ) : (
                <iframe
                  id="movie-player"
                  src={getEmbedUrl()}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
              )}

              <div className="absolute top-6 left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="px-4 py-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-white uppercase font-black tracking-widest">
                       {selectedServer === 'ultra' ? 'Ultra Premium Stream' : selectedServer === 'telegram' ? 'Smart Link Active' : 'Global Server Active'}
                    </span>
                 </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
                {(ultraStream || isMirrorLoading) && (
                   <Button
                    disabled={isMirrorLoading}
                    onClick={() => setSelectedServer('ultra')}
                    className="bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-700 text-white rounded-full px-8 h-12 shadow-[0_0_25px_rgba(234,179,8,0.4)] transition-all transform hover:scale-105 font-black uppercase italic"
                  >
                    {isMirrorLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating Premium Stream... [{countdown}s]</span>
                    ) : (
                      <span className="flex items-center gap-2"><Play className="w-4 h-4 mr-2 fill-white" /> Ultra Streaming Server</span>
                    )}
                  </Button>
                )}
                {telegramStream && (
                  <Button
                    onClick={() => setSelectedServer('telegram')}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105"
                  >
                    <Play className="w-4 h-4 mr-2 fill-white" /> {telegramStream.includes('movielinkbd') ? 'Play from MovieLinkBD' : 'Play Smart Server'}
                  </Button>
                )}
                <Button
                    onClick={() => window.open(getEmbedUrl(), '_blank')}
                    className="bg-white/5 hover:bg-white/10 text-white rounded-full px-8 h-12 border border-white/10 backdrop-blur-md transition-all"
                >
                    <Maximize className="w-4 h-4 mr-2" /> Open Full-Page
                </Button>
            </div>
          </section>

          {/* 2. DOWNLOAD CENTER SYSTEM */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-l-4 border-orange-500 pl-4">
               <div className="flex items-center gap-3">
                  <Download className="w-6 h-6 text-orange-500" />
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Download Center</h2>
               </div>
               {isMirrorLoading && <span className="text-[10px] text-yellow-500 font-bold animate-pulse">PREMIUM MIRROR BOT ACTIVE: {countdown}s remaining</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* STANDARD SERVERS */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Globe className="w-4 h-4" /> Standard Links</h3>
                <div className="grid grid-cols-1 gap-3">
                  <a
                    id="download-server-1"
                    href={railwayLinks[0] || "#"}
                    target={railwayLinks[0] ? "_blank" : "_self"}
                    rel="noreferrer"
                    className={`h-20 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-3xl shadow-xl border border-white/5 transition-all hover:scale-[1.03] group no-underline flex flex-col items-center justify-center gap-1 ${!railwayLinks[0] ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div className="flex items-center gap-2"><Download className="w-5 h-5 text-orange-500" /> <span className="text-sm font-black italic text-white uppercase">{railwayLinks[0] ? 'DOWNLOAD SERVER 1' : 'SERVER OFFLINE'}</span></div>
                    <span className="text-[9px] text-white/50 font-bold uppercase">{railwayLinks[0] ? 'Direct High Speed' : 'Not Available'}</span>
                  </a>

                  <a
                    id="download-server-2"
                    href={railwayLinks[1] || "#"}
                    target={railwayLinks[1] ? "_blank" : "_self"}
                    rel="noreferrer"
                    className={`h-20 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-3xl shadow-xl border border-white/5 transition-all hover:scale-[1.03] group no-underline flex flex-col items-center justify-center gap-1 ${!railwayLinks[1] ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div className="flex items-center gap-2"><Download className="w-5 h-5 text-blue-500" /> <span className="text-sm font-black italic text-white uppercase">{railwayLinks[1] ? 'DOWNLOAD SERVER 2' : 'SERVER OFFLINE'}</span></div>
                    <span className="text-[9px] text-white/50 font-bold uppercase">{railwayLinks[1] ? 'Mirror Link' : 'Not Available'}</span>
                  </a>
                </div>
              </div>

              {/* PREMIUM MIRROR SERVERS */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2"><Star className="w-4 h-4" /> Premium Mirrors (Bot Generated)</h3>
                <div className="grid grid-cols-1 gap-3">
                  <a
                    href={mirrorLinks[0] || "#"}
                    target={mirrorLinks[0] ? "_blank" : "_self"}
                    rel="noreferrer"
                    className={`h-20 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-700 rounded-3xl shadow-[0_0_30px_rgba(234,179,8,0.2)] border-none transition-all hover:scale-[1.03] group no-underline flex flex-col items-center justify-center gap-1 ${isMirrorLoading || !mirrorLinks[0] ? (countdown === 0 && !mirrorLinks[0] ? 'opacity-50 grayscale' : 'animate-pulse') : ''}`}
                  >
                    <div className="flex items-center gap-2"><Download className="w-5 h-5 text-white" /> <span className="text-sm font-black italic text-white uppercase">{isMirrorLoading ? `GENERATING... [${countdown}s]` : (mirrorLinks[0] ? 'HIGH-SPEED SERVER 3' : 'SERVER BUSY')}</span></div>
                    <span className="text-[9px] text-white/80 font-bold uppercase">{mirrorLinks[0] ? 'Ultra Fast Direct' : (countdown === 0 ? 'Wait for reset' : 'Mirror Bot Processing')}</span>
                  </a>

                  <a
                    href={mirrorLinks[1] || "#"}
                    target={mirrorLinks[1] ? "_blank" : "_self"}
                    rel="noreferrer"
                    className={`h-20 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-700 rounded-3xl shadow-[0_0_30px_rgba(234,179,8,0.2)] border-none transition-all hover:scale-[1.03] group no-underline flex flex-col items-center justify-center gap-1 ${isMirrorLoading || !mirrorLinks[1] ? (countdown === 0 && !mirrorLinks[1] ? 'opacity-50 grayscale' : 'animate-pulse') : ''}`}
                  >
                    <div className="flex items-center gap-2"><Download className="w-5 h-5 text-white" /> <span className="text-sm font-black italic text-white uppercase">{isMirrorLoading ? `GENERATING... [${countdown}s]` : (mirrorLinks[1] ? 'HIGH-SPEED SERVER 4' : 'SERVER BUSY')}</span></div>
                    <span className="text-[9px] text-white/80 font-bold uppercase">{mirrorLinks[1] ? 'Ultra Fast Direct' : (countdown === 0 ? 'Wait for reset' : 'Mirror Bot Processing')}</span>
                  </a>
                </div>
              </div>

            </div>
          </section>

          {/* 3. MOVIE INFO & REVIEW SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-white/5">
            {/* Left: Poster and Quick Info */}
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
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-black uppercase">Runtime</span>
                        <span className="font-bold">{(movie as any).runtime || 'N/A'} min</span>
                    </div>
                </div>
            </div>

            {/* Right: Story and Cast */}
            <div className="lg:col-span-8 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">The Storyline</h2>
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

                <div className="p-6 bg-orange-600/10 border border-orange-600/20 rounded-3xl flex items-start gap-4">
                    <Info className="w-6 h-6 text-orange-500 shrink-0" />
                    <p className="text-xs text-orange-200 leading-relaxed">
                        <b>Pro Tip:</b> Our player uses <b>Multi-Audio</b>. To get <b>Hindi audio</b>, click the Settings (Gear) icon inside the player &rarr; Audio &rarr; Hindi.
                    </p>
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
