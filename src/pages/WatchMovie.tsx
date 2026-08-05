import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Layout, Globe, Server, List, Download, Film, Info, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import MovieCard from '@/components/MovieCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WatchMovie = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movieId = id || '0';

  const [selectedServer, setSelectedServer] = useState('torrent');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [torrentData, setTorrentData] = useState<{ magnet: string; title: string; source: string } | null>(null);
  const [isTorrentLoading, setIsTorrentLoading] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  // 1. Fetch content from Supabase or TMDB
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-watch', movieId],
    queryFn: async () => {
      if (movieId.includes('-') && movieId.length === 36) {
        return await contentService.getContentById(movieId);
      }
      return null;
    },
    enabled: !!movieId
  });

  const { data: tmdbContent, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-content-watch', movieId],
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
  const isLoading = isLoadingSupabase || isLoadingTmdb;
  const isTV = supabaseContent
    ? supabaseContent.content_type === 'series'
    : !!(tmdbContent && ('name' in tmdbContent || 'first_air_date' in tmdbContent));

  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);
  const imdbId = (movie as any)?.imdb_id || (movie as any)?.external_ids?.imdb_id;

  // 2. Ensure IMDB ID is fetched
  const { data: externalIds } = useQuery({
    queryKey: ['tmdb-external-ids', tmdbId, isTV],
    queryFn: async () => {
      if (!tmdbId) return null;
      const url = isTV
        ? `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=566149bf98e53cc39a4c04bfe01c03fc`
        : `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=566149bf98e53cc39a4c04bfe01c03fc`;
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

  const primaryGenreId = (movie as any)?.genres?.[0]?.id ?? null;

  const { data: relatedContent = [] } = useQuery({
    queryKey: ['watch-related-content', tmdbId, primaryGenreId, isTV],
    queryFn: async () => {
      if (!tmdbId || !primaryGenreId) return [];

      const response = isTV
        ? await tmdbService.getTVShowsByGenre(Number(primaryGenreId), 1)
        : await tmdbService.getMoviesByGenre(Number(primaryGenreId), 1);

      return (response.results || [])
        .filter((item) => item.id !== tmdbId)
        .slice(0, 12);
    },
    enabled: !!tmdbId && !!primaryGenreId,
  });

  // 3. Torrentio Scraper with aggressive fallback logic
  useEffect(() => {
    const fetchTorrent = async () => {
      if (!finalImdbId) return;
      setIsTorrentLoading(true);
      setTorrentData(null);

      const providers = 'yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,tokyotosho,sukebei,tgx,glodls';
      const mirrors = [
        `https://torrentio.strem.fun`,
        `https://torrentio.fun`,
        `https://strem.fun`
      ];

      let found = false;
      for (const mirror of mirrors) {
        if (found) break;
        try {
          const url = isTV
            ? `${mirror}/providers=${providers}/stream/series/${finalImdbId}:${season}:${episode}.json`
            : `${mirror}/providers=${providers}/stream/movie/${finalImdbId}.json`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          const data = await response.json();

          if (data.streams && data.streams.length > 0) {
            // Strict Priority: "Hindi Dubbed" -> "Hindi" -> "Dual"
            const dubbed = data.streams.filter((s: any) => s.title.toLowerCase().includes('hindi dubbed'));
            const hindi = data.streams.filter((s: any) => s.title.toLowerCase().includes('hindi'));
            const dual = data.streams.filter((s: any) => s.title.toLowerCase().includes('dual'));

            const best = dubbed.length > 0 ? dubbed[0] : (hindi.length > 0 ? hindi[0] : (dual.length > 0 ? dual[0] : data.streams[0]));
            const hash = best.infoHash || best.url?.match(/btih:([a-fA-F0-9]+)/)?.[1];

            if (hash) {
              const trackers = "&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://9.rarbg.com:2810/announce&tr=udp://exodus.desync.com:6969/announce";
              const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(best.title.split('\n')[0])}${trackers}`;
              setTorrentData({ magnet, title: best.title, source: 'Torrentio' });
              found = true;
            }
          }
        } catch (e) {
          console.warn("Mirror failed:", mirror);
        }
      }
      setIsTorrentLoading(false);
    };

    if (finalImdbId) fetchTorrent();
  }, [finalImdbId, isTV, season, episode]);

  const handleDownloadMagnet = () => {
    if (!torrentData?.magnet) return;
    window.location.href = torrentData.magnet;
  };

  const handleCopyMagnet = async () => {
    if (!torrentData?.magnet) return;
    try {
      await navigator.clipboard.writeText(torrentData.magnet);
    } catch (e) {
      console.warn('Clipboard copy failed', e);
    }
  };

  const getEmbedUrl = () => {
    if (selectedServer === 'torrent' && torrentData?.magnet) {
      // Use webtor.io - a much more reliable web-based torrent player
      return `https://webtor.io/show?magnet=${encodeURIComponent(torrentData.magnet)}`;
    }

    // Server Fallbacks
    if (!tmdbId) return '';

    if (isTV) {
      switch (selectedServer) {
        case 'server1': return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        case 'server2': return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
        case 'hindi': return `https://vidsrc.in/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        case 'torrent': return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        default: return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
    } else {
      switch (selectedServer) {
        case 'server1': return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
        case 'server2': return `https://vidlink.pro/movie/${tmdbId}`;
        case 'hindi': return `https://vidsrc.in/embed/movie/${tmdbId}`;
        case 'torrent': return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
        default: return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Content not found</h1>
          <Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 text-white">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const title = (movie as any).title || (movie as any).name;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>
          <div className="flex-1 text-center truncate px-4">
            <h1 className="text-lg font-bold truncate">{title}</h1>
          </div>
          <div className="w-[100px] md:w-[150px]"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Player Container */}
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
            {isTorrentLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                <p className="text-white font-medium">Loading premium stream...</p>
              </div>
            ) : (
              <iframe
                src={getEmbedUrl()}
                className="w-full h-full"
                frameBorder="0"
                scrolling="no"
                title="Player"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              ></iframe>
            )}

            <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-gray-400 border border-white/10 uppercase tracking-widest font-black">
                {selectedServer === 'torrent' && torrentData ? 'PREMIUM TORRENT STREAM' : 'HIGH SPEED SERVER'}
               </span>
            </div>
          </div>

          {/* Hindi Audio Guide */}
          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-3">
             <Info className="w-5 h-5 text-purple-400 shrink-0" />
             <p className="text-xs text-purple-200">
               <span className="font-bold">Hindi Audio Guide:</span> Most Hollywood movies are <b>Multi-Audio</b>.
               1. <b>In Player:</b> Click the <b>Settings (Gear)</b> or <b>Audio icon</b> to select Hindi.
               2. <b>After Download:</b> Use your player (VLC/MX Player) settings to switch to the Hindi audio track.
             </p>
          </div>

          {/* Multi-Source Download Section */}
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Download className="w-5 h-5 text-orange-500" />
              Download Options
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Torrentio Download */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleDownloadMagnet}
                  className={`h-14 bg-gradient-to-br from-orange-600 to-red-700 hover:scale-[1.02] transition-all border-none rounded-xl flex flex-col items-center justify-center gap-0 shadow-lg text-white w-full ${!torrentData?.magnet ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="font-bold text-sm">Download Torrent</span>
                  </div>
                  <span className="text-[9px] opacity-70 uppercase font-black">Hindi Dubbed Priority</span>
                </Button>
                {torrentData?.magnet && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyMagnet}
                    className="text-[10px] text-gray-500 hover:text-white"
                  >
                    Copy Magnet Link (Manual)
                  </Button>
                )}
              </div>

              {/* Direct Download */}
              <a
                href={`https://vidsrc.to/download/${isTV ? 'tv' : 'movie'}/${finalImdbId || tmdbId}`}
                target="_blank"
                rel="noreferrer"
                className="h-14 bg-gradient-to-br from-green-600 to-emerald-700 hover:scale-[1.02] transition-all border-none rounded-xl flex flex-col items-center justify-center gap-0 shadow-lg no-underline text-white"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="font-bold text-sm">Direct Download</span>
                </div>
                <span className="text-[9px] opacity-70 uppercase font-black">Multi-Audio / Fast</span>
              </a>

              {/* Server Switch Fallback */}
              <Button
                onClick={() => setSelectedServer('hindi')}
                className="h-14 bg-purple-900/50 hover:bg-purple-800 hover:scale-[1.02] transition-all border border-purple-500/20 rounded-xl flex flex-col items-center justify-center gap-0 shadow-lg"
              >
                <div className="flex items-center gap-2 text-white">
                  <Film className="w-4 h-4" />
                  <span className="font-bold text-sm">Hindi Specialist</span>
                </div>
                <span className="text-[9px] opacity-50 uppercase font-black text-white">Dedicated Hindi Server</span>
              </Button>
            </div>

            {torrentData?.title && (
              <p className="text-[10px] text-gray-500 text-center animate-fade-in">
                Selected Source: {torrentData.title.split('\n')[0]}
              </p>
            )}
          </div>

          {/* Controls & Server Switcher */}
          <div className="mt-8 flex flex-col md:flex-row gap-6 items-start justify-between bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold">Select Player Server</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setSelectedServer('torrent')} variant={selectedServer === 'torrent' ? 'default' : 'outline'} className={selectedServer === 'torrent' ? 'bg-orange-600' : 'border-white/10'}>
                  <Download className="w-4 h-4 mr-2" /> Torrent Stream
                </Button>
                <Button onClick={() => setSelectedServer('hindi')} variant={selectedServer === 'hindi' ? 'default' : 'outline'} className={selectedServer === 'hindi' ? 'bg-orange-500' : 'border-white/10'}>
                  <Globe className="w-4 h-4 mr-2" /> Server: Hindi (Auto)
                </Button>
                <Button onClick={() => setSelectedServer('server2')} variant={selectedServer === 'server2' ? 'default' : 'outline'} className={selectedServer === 'server2' ? 'bg-purple-600' : 'border-white/10'}>
                  <Server className="w-4 h-4 mr-2" /> Server: VidLink
                </Button>
                <Button onClick={() => setSelectedServer('server1')} variant={selectedServer === 'server1' ? 'default' : 'outline'} className={selectedServer === 'server1' ? 'bg-purple-600' : 'border-white/10'}>
                  <Server className="w-4 h-4 mr-2" /> Server: Vidsrc
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 italic">
                Note: "Server: Hindi" is specifically optimized for Indian audio tracks. If one server doesn't show the language icon, try switching to another.
              </p>
            </div>

            {isTV && (
              <div className="w-full md:w-auto space-y-4">
                <div className="flex items-center gap-3">
                  <List className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold">Episodes</h2>
                </div>
                <div className="flex gap-3">
                  <Select value={season.toString()} onValueChange={(v) => setSeason(parseInt(v))}>
                    <SelectTrigger className="w-24 bg-black/40 border-white/10 rounded-xl">
                      <SelectValue placeholder="S1" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10 text-white">
                      {[...Array(20)].map((_, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>S {i + 1}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={episode.toString()} onValueChange={(v) => setEpisode(parseInt(v))}>
                    <SelectTrigger className="w-24 bg-black/40 border-white/10 rounded-xl">
                      <SelectValue placeholder="E1" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10 text-white">
                      {[...Array(50)].map((_, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>E {i + 1}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Related Content */}
          <div className="mt-16">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                More Like This
            </h2>
            {relatedContent && relatedContent.length > 0 ? (
              <div className="relative">
                <Carousel opts={{ align: "start", slidesToScroll: 2 }} className="w-full">
                  <CarouselContent className="-ml-4">
                    {relatedContent.map((movie, index) => (
                      <CarouselItem key={`${movie.id}-${index}`} className="pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
                        <MovieCard movie={movie} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0 -translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-colors" />
                  <CarouselNext className="right-0 translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-colors" />
                </Carousel>
              </div>
            ) : (
              <p className="text-gray-500 italic">No recommendations found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchMovie;
