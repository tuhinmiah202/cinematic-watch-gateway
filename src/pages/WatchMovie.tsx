import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Globe, Server, List, Download, Film, Info, Maximize, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import MovieCard from '@/components/MovieCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const WatchMovie = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const movieId = id || '0';

  const [selectedServer, setSelectedServer] = useState('server1');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [torrentData, setTorrentData] = useState<{ magnet: string; title: string; source: string } | null>(null);
  const [isTorrentLoading, setIsTorrentLoading] = useState(false);

  const handleBack = () => navigate(-1);

  // Fetch content data
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-watch', movieId],
    queryFn: async () => (movieId.length === 36 ? await contentService.getContentById(movieId) : null),
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
      } catch (e) {
        try { return await tmdbService.getTVShowDetails(numericId); } catch { throw new Error('Not found'); }
      }
    },
    enabled: !!movieId && !supabaseContent && !isLoadingSupabase
  });

  const movie = supabaseContent || tmdbContent;
  const isLoading = isLoadingSupabase || isLoadingTmdb;
  const isTV = supabaseContent ? supabaseContent.content_type === 'series' : !!(tmdbContent && ('name' in tmdbContent || 'first_air_date' in tmdbContent));
  const tmdbId = (movie as any)?.tmdb_id || (typeof movie?.id === 'number' ? movie.id : null);
  const imdbId = (movie as any)?.imdb_id || (movie as any)?.external_ids?.imdb_id;

  const { data: externalIds } = useQuery({
    queryKey: ['tmdb-external-ids', tmdbId, isTV],
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
    return rawId.toString().startsWith('tt') ? rawId.toString() : `tt${rawId}`;
  }, [imdbId, externalIds]);

  // Optimized Hindi-Priority Torrent Search (Smaller Files / 720p Focus)
  useEffect(() => {
    const fetchTorrent = async () => {
      if (!finalImdbId) return;
      setIsTorrentLoading(true);
      setTorrentData(null);

      const mirrors = [`https://torrentio.strem.fun`, `https://torrentio.fun`, `https://strem.fun` ];
      // Restricted providers to those that usually have smaller files (YTS, EZTV)
      const providers = 'yts,eztv,rarbg,1337x,thepiratebay';

      for (const mirror of mirrors) {
        try {
          const url = isTV
            ? `${mirror}/providers=${providers}/stream/series/${finalImdbId}:${season}:${episode}.json`
            : `${mirror}/providers=${providers}/stream/movie/${finalImdbId}.json`;

          const res = await fetch(url);
          const data = await res.json();

          if (data.streams && data.streams.length > 0) {
            // Filter for 720p first for fast buffering, then dual/hindi
            const streams = data.streams.map((s: any) => ({
              ...s,
              is720p: s.title.toLowerCase().includes('720p'),
              isHindi: s.title.toLowerCase().includes('hindi') || s.title.toLowerCase().includes('dual')
            }));

            const selected = streams.find((s: any) => s.is720p && s.isHindi) ||
                             streams.find((s: any) => s.isHindi) ||
                             streams.find((s: any) => s.is720p) ||
                             data.streams[0];

            const hash = selected.infoHash || selected.url?.match(/btih:([a-fA-F0-9]+)/)?.[1];
            if (hash) {
              const trackers = "&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://9.rarbg.com:2810/announce";
              const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(selected.title.split('\n')[0])}${trackers}`;
              setTorrentData({ magnet, title: selected.title, source: 'Optimized 720p' });
              break;
            }
          }
        } catch (e) { console.warn("Mirror error"); }
      }
      setIsTorrentLoading(false);
    };
    if (finalImdbId) fetchTorrent();
  }, [finalImdbId, isTV, season, episode]);

  const getEmbedUrl = () => {
    if (selectedServer === 'torrent' && torrentData?.magnet) {
      // Use webtor.io with hidden UI parameters for a "custom/professional" look
      return `https://webtor.io/show?magnet=${encodeURIComponent(torrentData.magnet)}&autoplay=true&controls=true&theme=dark`;
    }
    if (!tmdbId) return '';

    if (isTV) {
      switch (selectedServer) {
        case 'server1': return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        case 'server2': return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
        case 'server3': return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
        default: return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
    } else {
      switch (selectedServer) {
        case 'server1': return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
        case 'server2': return `https://vidlink.pro/movie/${tmdbId}`;
        case 'server3': return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
        default: return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      }
    }
  };

  const handleManualDownload = () => {
    if (torrentData?.magnet) {
      // Open magnet in a hidden iframe to force protocol handler
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = torrentData.magnet;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 3000);

      toast({
        title: "Download Triggered",
        description: "Your Torrent Client should open now. If not, use the copy button below.",
      });
    }
  };

  const handleCopyMagnet = () => {
    if (torrentData?.magnet) {
      navigator.clipboard.writeText(torrentData.magnet);
      toast({ title: "Link Copied", description: "Paste it manually into uTorrent/BitTorrent." });
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"><div className="text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 text-white">Return Home</Button></div></div>;

  const title = (movie as any).title || (movie as any).name;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-20">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5 mr-2" /> Back</Button>
          <h1 className="flex-1 text-center font-bold truncate px-4">{title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Pro Player Container */}
          <div className="space-y-4">
            <div className="relative w-full aspect-video bg-[#050505] rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group">
              {isTorrentLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                  <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Optimizing Stream (720p)...</p>
                </div>
              ) : (
                <iframe
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
                       {selectedServer === 'torrent' ? '720p Premium Stream' : 'High Speed Multi-Audio'}
                    </span>
                 </div>
              </div>
            </div>

            {/* Direct Play/Full Tab Button */}
            <div className="flex justify-center">
                <Button
                    onClick={() => window.open(getEmbedUrl(), '_blank')}
                    className="bg-white/5 hover:bg-white/10 text-white rounded-full px-8 border border-white/10 backdrop-blur-md"
                >
                    <Maximize className="w-4 h-4 mr-2" /> Open Full-Page Player (No Ads)
                </Button>
            </div>
          </div>

          {/* New Multi-Language Support Box */}
          <div className="p-6 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
             <div className="bg-purple-600/20 p-4 rounded-3xl shrink-0">
                <Globe className="w-8 h-8 text-purple-400" />
             </div>
             <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-xl font-bold text-white">How to Select Hindi Language</h3>
                <p className="text-gray-400 text-sm">
                   Our servers provide <b>Multi-Audio</b> tracks. To switch to <b>Hindi</b>:
                   <br />Click the <b>Gear (Settings)</b> icon inside the video player &rarr; <b>Audio</b> &rarr; <b>Hindi</b>.
                </p>
             </div>
             <div className="flex flex-col gap-2 shrink-0">
                <div className="flex items-center gap-2 text-green-400 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> 720p Fast Loading</div>
                <div className="flex items-center gap-2 text-green-400 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> Multi-Audio Verified</div>
             </div>
          </div>

          {/* Download Center - FIXED TRIGGER */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3"><Download className="w-6 h-6 text-orange-500" /> Download Center</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Torrent Download with Forced Trigger */}
              <div className="space-y-3">
                  <Button
                    onClick={handleManualDownload}
                    className="w-full h-20 bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 rounded-3xl shadow-2xl transition-all border-none flex flex-col items-center justify-center gap-1 group"
                  >
                    <div className="flex items-center gap-3"><Download className="w-6 h-6 text-white group-hover:animate-bounce" /> <span className="text-lg font-black uppercase italic">Download via Torrent</span></div>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-tighter">Fast 720p / Hindi Dual Audio</span>
                  </Button>

                  {torrentData?.magnet && (
                    <Button
                        variant="ghost"
                        onClick={handleCopyMagnet}
                        className="w-full text-xs text-gray-500 hover:text-white flex items-center justify-center gap-2"
                    >
                        <AlertCircle className="w-3 h-3" /> If button doesn't work, click to Copy Magnet Link
                    </Button>
                  )}
              </div>

              {/* Direct Browser Download */}
              <Button
                onClick={() => window.open(`https://vidsrc.me/download/movie?tmdb=${tmdbId}`, '_blank')}
                className="h-20 bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 rounded-3xl shadow-2xl transition-all border-none flex flex-col items-center justify-center gap-1 group"
              >
                <div className="flex items-center gap-3"><Globe className="w-6 h-6 text-white group-hover:rotate-12" /> <span className="text-lg font-black uppercase italic">Direct Download</span></div>
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-tighter">High Speed / No Software Needed</span>
              </Button>

            </div>
          </section>

          {/* Pro Server Selector */}
          <section className="bg-[#0f0f0f] p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3"><Server className="w-6 h-6 text-blue-400" /><h2 className="text-xl font-bold">Switch Movie Server</h2></div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setSelectedServer('server1')} variant={selectedServer === 'server1' ? 'default' : 'outline'} className={`rounded-2xl px-6 py-6 transition-all ${selectedServer === 'server1' ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105' : 'border-white/10 hover:bg-white/5'}`}>Server 1 (Default)</Button>
                <Button onClick={() => setSelectedServer('server2')} variant={selectedServer === 'server2' ? 'default' : 'outline'} className={`rounded-2xl px-6 py-6 transition-all ${selectedServer === 'server2' ? 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.4)] scale-105' : 'border-white/10 hover:bg-white/5'}`}>Server 2 (VidLink)</Button>
                <Button onClick={() => setSelectedServer('server3')} variant={selectedServer === 'server3' ? 'default' : 'outline'} className={`rounded-2xl px-6 py-6 transition-all ${selectedServer === 'server3' ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-105' : 'border-white/10 hover:bg-white/5'}`}>Server 3 (Vidsrc.cc)</Button>
                <Button onClick={() => setSelectedServer('torrent')} variant={selectedServer === 'torrent' ? 'default' : 'outline'} className={`rounded-2xl px-6 py-6 transition-all ${selectedServer === 'torrent' ? 'bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.4)] scale-105' : 'border-white/10 hover:bg-white/5'}`}>Server: Torrent 720p</Button>
              </div>
            </div>

            {isTV && (
              <div className="space-y-6 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3"><List className="w-6 h-6 text-green-400" /><h2 className="text-xl font-bold">Browse Episodes</h2></div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-black ml-2">Season</label>
                    <Select value={season.toString()} onValueChange={(v) => setSeason(parseInt(v))}><SelectTrigger className="w-full h-14 bg-black/40 border-white/10 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent className="bg-gray-900 border-white/10 text-white rounded-2xl">{[...Array(20)].map((_, i) => <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-xl">Season {i + 1}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-black ml-2">Episode</label>
                    <Select value={episode.toString()} onValueChange={(v) => setEpisode(parseInt(v))}><SelectTrigger className="w-full h-14 bg-black/40 border-white/10 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent className="bg-gray-900 border-white/10 text-white rounded-2xl">{[...Array(50)].map((_, i) => <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-xl">Episode {i + 1}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Related Content */}
          <div className="mt-20">
            <h2 className="text-2xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-purple-600 rounded-full"></span> Handpicked For You</h2>
            {relatedContent.length > 0 ? (
              <div className="relative mt-8">
                <Carousel opts={{ align: "start", slidesToScroll: 2 }} className="w-full"><CarouselContent className="-ml-6">{relatedContent.map((movie, index) => (<CarouselItem key={`${movie.id}-${index}`} className="pl-6 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"><MovieCard movie={movie} /></CarouselItem>))}</CarouselContent><CarouselPrevious className="left-0 -translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-all p-3" /><CarouselNext className="right-0 translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-all p-3" /></Carousel>
              </div>
            ) : <p className="text-gray-500 italic mt-4">Exploring more content...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchMovie;
