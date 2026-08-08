import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Play, User, Download, Globe, Server, Info, Maximize, AlertCircle } from 'lucide-react';
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
  const movieId = id || '0';

  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<ApiResult[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleBack = () => navigate(-1);

  // 1. Fetch content from Supabase or TMDB
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-detail', movieId],
    queryFn: async () => (movieId.length === 36 ? await contentService.getContentById(movieId) : null),
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
      } catch (e) {
        return await tmdbService.getTVShowDetails(numericId);
      }
    },
    enabled: !!movieId && !supabaseContent
  });

  const movie = supabaseContent || tmdbContent;
  const isTV = supabaseContent ? supabaseContent.content_type === 'series' : !!(tmdbContent && ('name' in tmdbContent || 'first_air_date' in tmdbContent));
  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);
  const imdbId = (movie as any)?.imdb_id || (movie as any)?.external_ids?.imdb_id;

  // 2. Movie Name Cleaning
  const cleanMovieName = (name: string) => {
    return name.replace(/\(\d{4}\)/g, '').replace(/\[.*\]/g, '').replace(/[^\w\s]/gi, ' ').trim();
  };

  // 3. Robust API Fetching & Button Generation
  useEffect(() => {
    const fetchApiData = async () => {
      const title = (movie as any)?.title || (movie as any)?.name;
      if (!title) return;

      const query = cleanMovieName(title);
      setIsApiLoading(true);

      try {
        const response = await fetch(`https://web-production-69ea9.up.railway.app/get-telegram-movie?name=${encodeURIComponent(query)}`);
        const data = await response.json();

        let results: ApiResult[] = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);

        // --- Requirement 5: Server Hierarchy (HINDI / MULTI first) ---
        results = results.sort((a, b) => {
          const aText = a.text.toUpperCase();
          const bText = b.text.toUpperCase();
          if (aText.includes("HINDI") || aText.includes("MULTI")) return -1;
          if (bText.includes("HINDI") || bText.includes("MULTI")) return 1;
          return 0;
        });

        setApiResults(results);

        // --- Requirement 2: Default Player (First link) ---
        if (results.length > 0 && results[0].links?.length > 0) {
          setSelectedStreamUrl(results[0].links[0]);
        } else {
          // Stable fallback if API returns nothing
          setSelectedStreamUrl(`https://vidsrc.to/embed/${isTV ? 'tv' : 'movie'}/${tmdbId}`);
        }

      } catch (error) {
        setApiError('Server currently busy, please try another movie.');
        setSelectedStreamUrl(`https://vidsrc.to/embed/${isTV ? 'tv' : 'movie'}/${tmdbId}`);
      } finally {
        setIsApiLoading(false);
      }
    };

    if (movie) fetchApiData();
  }, [movie, isTV, tmdbId]);

  // Derived sections
  const downloadLinks = apiResults.filter(r => r.text.toUpperCase().includes('PREMIUM'));
  const highlightKeywords = ['HINDI', 'MULTI', 'ALICE', 'MONGO'];

  if (isLoadingSupabase || (isLoadingTmdb && !supabaseContent)) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600">Return Home</Button></div>;

  const title = (movie as any).title || (movie as any).name;

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
                  <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Searching best server...</p>
                </div>
              ) : (
                <iframe
                  id="movie-player"
                  src={selectedStreamUrl || ''}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                ></iframe>
              )}
            </div>

            {/* 3. DYNAMIC SERVER LIST (Requirement 3 & 4) */}
            <div id="server-list" className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                    <Server className="w-6 h-6 text-purple-500" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-purple-200">Select Streaming Server</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Default Stable Link */}
                    <Button
                        onClick={() => setSelectedStreamUrl(`https://vidsrc.to/embed/${isTV ? 'tv' : 'movie'}/${tmdbId}`)}
                        className={`h-auto py-4 px-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${
                            selectedStreamUrl?.includes('vidsrc.to')
                            ? "bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.4)] text-white"
                            : "bg-white/5 border-white/5 text-gray-400"
                        }`}
                    >
                        SERVER: STABLE
                    </Button>

                    {/* API Generated Buttons */}
                    {apiResults.map((server, idx) => {
                        const displayName = server.text.replace(/\[.*\]/gi, '').split('-')[0].trim().toUpperCase() || `SERVER ${idx + 1}`;
                        const isHighlighted = highlightKeywords.some(kw => displayName.includes(kw));
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
                                    ? (isHighlighted ? "bg-orange-600 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.4)] text-white" : "bg-purple-600 border-purple-400 text-white")
                                    : (isHighlighted
                                        ? "border-orange-500/50 bg-orange-500/5 text-orange-500 hover:bg-orange-500/20"
                                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white")
                                }`}
                            >
                                {displayName}
                            </Button>
                        );
                    })}
                </div>
            </div>
          </section>

          {/* 2. DOWNLOAD CENTER */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4">
               <Download className="w-6 h-6 text-orange-500" />
               <h2 className="text-2xl font-black uppercase tracking-tighter">High-Speed Download Links</h2>
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

          {/* STORY & INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-white/5">
            <div className="lg:col-span-4 space-y-6">
                <img src={`https://image.tmdb.org/t/p/w500${(movie as any).poster_path}`} alt={title} className="w-full rounded-[2rem] shadow-2xl border border-white/10" />
            </div>
            <div className="lg:col-span-8 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Storyline</h2>
                    <p className="text-gray-400 leading-relaxed text-lg font-light">{(movie as any).overview}</p>
                </div>
                <div className="p-6 bg-purple-600/10 border border-purple-600/20 rounded-3xl flex items-start gap-4">
                    <Info className="w-6 h-6 text-purple-500 shrink-0" />
                    <p className="text-xs text-purple-200 leading-relaxed">
                        <b>How to get Hindi:</b> Select the <b>HINDI (PRO)</b> server from the list. If it's English, click the <b>Gear (Settings)</b> icon inside the video and change <b>Audio</b> to <b>Hindi</b>.
                    </p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
