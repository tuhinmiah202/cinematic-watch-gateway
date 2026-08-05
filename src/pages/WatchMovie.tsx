import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Globe, Server, List, Download, Film, Info, Maximize, AlertTriangle } from 'lucide-react';
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

  // Aggressive Hindi-Priority Torrent Search
  useEffect(() => {
    const fetchTorrent = async () => {
      if (!finalImdbId) return;
      setIsTorrentLoading(true);
      setTorrentData(null);

      const mirrors = [`https://torrentio.strem.fun`, `https://torrentio.fun`, `https://strem.fun` ];
      const providers = 'yts,eztv,rarbg,1337x,thepiratebay,tgx,glodls,zooqle,kickasstorrents';

      for (const mirror of mirrors) {
        try {
          const url = isTV
            ? `${mirror}/providers=${providers}/stream/series/${finalImdbId}:${season}:${episode}.json`
            : `${mirror}/providers=${providers}/stream/movie/${finalImdbId}.json`;

          const res = await fetch(url);
          const data = await res.json();

          if (data.streams && data.streams.length > 0) {
            // Find EXPLICIT Hindi Dubbed first
            const hindiDubbed = data.streams.filter((s: any) =>
              s.title.toLowerCase().includes('hindi dubbed') ||
              (s.title.toLowerCase().includes('hindi') && s.title.toLowerCase().includes('dub'))
            );

            const dualAudio = data.streams.filter((s: any) => s.title.toLowerCase().includes('hindi'));
            const selected = hindiDubbed[0] || dualAudio[0] || data.streams[0];

            const hash = selected.infoHash || selected.url?.match(/btih:([a-fA-F0-9]+)/)?.[1];
            if (hash) {
              const trackers = "&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://9.rarbg.com:2810/announce";
              const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(selected.title.split('\n')[0])}${trackers}`;
              setTorrentData({ magnet, title: selected.title, source: 'Hindi Priority' });
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
      return `https://webtor.io/show?magnet=${encodeURIComponent(torrentData.magnet)}&autoplay=true`;
    }
    if (!tmdbId) return '';

    // Server 1: Vidsrc.xyz (Most stable, good Hindi)
    // Server 2: VidLink.pro (Reliable secondary)
    // Server 3: Vidsrc.me (Solid backup)
    if (isTV) {
      switch (selectedServer) {
        case 'server1': return `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        case 'server2': return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
        case 'server3': return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        default: return `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
    } else {
      switch (selectedServer) {
        case 'server1': return `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`;
        case 'server2': return `https://vidlink.pro/movie/${tmdbId}`;
        case 'server3': return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
        default: return `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`;
      }
    }
  };

  const primaryGenreId = (movie as any)?.genres?.[0]?.id ?? null;
  const { data: relatedContent = [] } = useQuery({
    queryKey: ['watch-related-content', tmdbId, primaryGenreId, isTV],
    queryFn: async () => {
      if (!tmdbId || !primaryGenreId) return [];
      const response = isTV ? await tmdbService.getTVShowsByGenre(Number(primaryGenreId), 1) : await tmdbService.getMoviesByGenre(Number(primaryGenreId), 1);
      return (response.results || []).filter((item) => item.id !== tmdbId).slice(0, 12);
    },
    enabled: !!tmdbId && !!primaryGenreId,
  });

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (!movie) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"><div className="text-center text-white"><h1 className="text-2xl font-bold mb-4">Content not found</h1><Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 text-white">Return Home</Button></div></div>;

  const title = (movie as any).title || (movie as any).name;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Fixed Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5 mr-2" /> Back</Button>
          <h1 className="flex-1 text-center font-bold truncate px-4">{title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Main Stream Player Section */}
          <section id="player-section" className="space-y-4">
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
              {isTorrentLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                  <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Finding Hindi Dubbed Stream...</p>
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
              <div className="absolute top-4 left-4 pointer-events-none">
                 <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-gray-400 border border-white/10 uppercase font-black">
                   {selectedServer === 'torrent' ? 'HINDI TORRENT STREAM' : 'HIGH SPEED SERVER'}
                 </span>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl flex items-start gap-3">
               <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
               <div className="text-xs space-y-1">
                 <p className="text-orange-200 font-bold">How to get Hindi Audio:</p>
                 <p className="text-orange-200/80">Most movies are <b>Multi-Audio</b>. If it starts in English, click the <b>Settings (Gear)</b> or <b>Audio</b> icon inside the video screen and select <b>Hindi</b>.</p>
               </div>
            </div>
          </section>

          {/* Download Center - ULTRA RELIABLE DIRECT LINKS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-3"><Download className="w-5 h-5 text-orange-500" /> Download Center</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* BUTTON 1: TORRENT HINDI */}
              <div className="group relative">
                {!torrentData?.magnet && !isTorrentLoading && (
                  <div className="absolute -top-2 -right-2 z-10"><AlertTriangle className="w-5 h-5 text-yellow-500" /></div>
                )}
                <a
                  href={torrentData?.magnet || `https://1337x.to/search/${encodeURIComponent(title + ' hindi dubbed')}/1/`}
                  target={torrentData?.magnet ? "_self" : "_blank"}
                  className="flex flex-col items-center justify-center gap-1 h-20 bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 rounded-2xl shadow-xl transition-all hover:scale-[1.02] no-underline text-white font-bold"
                >
                  <div className="flex items-center gap-2"><Download className="w-5 h-5" /> <span>{torrentData?.magnet ? 'Download Torrent' : 'Search Torrent'}</span></div>
                  <span className="text-[10px] opacity-80 uppercase font-black tracking-tighter">Hindi Dubbed Priority</span>
                </a>
                {torrentData?.magnet && (
                  <p className="text-[9px] text-gray-500 text-center mt-2 px-2 truncate">Found: {torrentData.title.split('\n')[0]}</p>
                )}
              </div>

              {/* BUTTON 2: DIRECT FAST DOWNLOAD */}
              <a
                href={`https://vidsrc.me/download/movie?tmdb=${tmdbId}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center gap-1 h-20 bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 rounded-2xl shadow-xl transition-all hover:scale-[1.02] no-underline text-white font-bold"
              >
                <div className="flex items-center gap-2"><Globe className="w-5 h-5" /> <span>Direct Download</span></div>
                <span className="text-[10px] opacity-80 uppercase font-black tracking-tighter">High Speed / Multi-Audio</span>
              </a>

              {/* BUTTON 3: FULL SCREEN MODE */}
              <Button
                onClick={() => window.open(getEmbedUrl(), '_blank')}
                className="flex flex-col items-center justify-center gap-1 h-20 bg-gray-800 hover:bg-gray-700 rounded-2xl shadow-xl border border-white/5 transition-all hover:scale-[1.02] text-white font-bold"
              >
                <div className="flex items-center gap-2"><Maximize className="w-5 h-5" /> <span>Full Screen Stream</span></div>
                <span className="text-[10px] opacity-50 uppercase font-black tracking-tighter">New Tab / No Ads</span>
              </Button>

            </div>
          </section>

          {/* Server Selection */}
          <section className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-purple-400" /><h2 className="text-lg font-bold">Select Streaming Server</h2></div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setSelectedServer('server1')} variant={selectedServer === 'server1' ? 'default' : 'outline'} className={selectedServer === 'server1' ? 'bg-purple-600' : 'border-white/10'}>Server 1 (Best Hindi Support)</Button>
                <Button onClick={() => setSelectedServer('server2')} variant={selectedServer === 'server2' ? 'default' : 'outline'} className={selectedServer === 'server2' ? 'bg-purple-600' : 'border-white/10'}>Server 2 (VidLink)</Button>
                <Button onClick={() => setSelectedServer('server3')} variant={selectedServer === 'server3' ? 'default' : 'outline'} className={selectedServer === 'server3' ? 'bg-purple-600' : 'border-white/10'}>Server 3 (Stable Backup)</Button>
                <Button onClick={() => setSelectedServer('torrent')} variant={selectedServer === 'torrent' ? 'default' : 'outline'} className={selectedServer === 'torrent' ? 'bg-orange-600' : 'border-white/10'}>Server: Torrent Stream</Button>
              </div>
            </div>

            {isTV && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3"><List className="w-5 h-5 text-blue-400" /><h2 className="text-lg font-bold">Episode Selector</h2></div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black">Season</label>
                    <Select value={season.toString()} onValueChange={(v) => setSeason(parseInt(v))}><SelectTrigger className="w-full bg-black/40 border-white/10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="bg-gray-900 border-white/10 text-white">{[...Array(20)].map((_, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>Season {i + 1}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black">Episode</label>
                    <Select value={episode.toString()} onValueChange={(v) => setEpisode(parseInt(v))}><SelectTrigger className="w-full bg-black/40 border-white/10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="bg-gray-900 border-white/10 text-white">{[...Array(50)].map((_, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>Episode {i + 1}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Related Content */}
          <div className="mt-16">
            <h2 className="text-2xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-purple-600 rounded-full"></span> More Like This</h2>
            {relatedContent.length > 0 ? (
              <div className="relative mt-6">
                <Carousel opts={{ align: "start", slidesToScroll: 2 }} className="w-full"><CarouselContent className="-ml-4">{relatedContent.map((movie, index) => (<CarouselItem key={`${movie.id}-${index}`} className="pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"><MovieCard movie={movie} /></CarouselItem>))}</CarouselContent><CarouselPrevious className="left-0 -translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-colors" /><CarouselNext className="right-0 translate-x-1/2 bg-black/80 text-white border-white/10 hover:bg-purple-600 transition-colors" /></Carousel>
              </div>
            ) : <p className="text-gray-500 italic mt-4">No recommendations found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchMovie;
