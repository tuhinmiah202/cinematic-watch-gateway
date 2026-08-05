import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Layout, Globe, Server, List, Download, Film } from 'lucide-react';
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
  const [torrentData, setTorrentData] = useState<{ magnet: string; title: string } | null>(null);
  const [ytsData, setYtsData] = useState<{ magnet: string; title: string } | null>(null);
  const [isTorrentLoading, setIsTorrentLoading] = useState(false);
  const [isYtsLoading, setIsYtsLoading] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  // Try to fetch from Supabase first (for admin content)
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

  // Fetch from TMDB if not found in Supabase
  const { data: tmdbContent, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-content-watch', movieId],
    queryFn: async () => {
      if (supabaseContent) return null;
      
      const numericId = parseInt(movieId);
      if (isNaN(numericId)) return null;
      
      try {
        const details = await tmdbService.getMovieDetails(numericId);
        return details;
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

  // Fetch External IDs if we don't have IMDB ID yet
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
    return rawId.toString().startsWith('tt') ? rawId.toString() : `tt${rawId}`;
  }, [imdbId, externalIds]);

  // Related content ("More Like This")
  const primaryGenreId = (movie as any)?.genres?.[0]?.id ?? null;

  const { data: relatedContent } = useQuery({
    queryKey: ['watch-related-content', tmdbId, primaryGenreId, isTV],
    queryFn: async () => {
      const genreId = Number(primaryGenreId);
      if (!genreId || isNaN(genreId)) return [];
      try {
        const response = isTV
          ? await tmdbService.getTVShowsByGenre(genreId, 1)
          : await tmdbService.getMoviesByGenre(genreId, 1);
        return (response?.results || [])
          .filter((item: any) => item.id != tmdbId)
          .slice(0, 12);
      } catch (error) {
        console.error('Error fetching related content:', error);
        return [];
      }
    },
    enabled: !!primaryGenreId && !!tmdbId,
  });

  // Torrentio API Integration
  useEffect(() => {
    const fetchTorrent = async () => {
      if (!finalImdbId) return;
      setIsTorrentLoading(true);
      setTorrentData(null);

      const providers = 'yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,tokyotosho,sukebei,tgx,glodls,zooqle';

      const mirrors = [
        `https://torrentio.strem.fun`,
        `https://torrentio.fun`,
        `https://strem.fun`,
        `https://torrentio.run`
      ];

      let bestStream = null;

      for (const mirror of mirrors) {
        if (bestStream) break;

        try {
          const type = isTV ? 'series' : 'movie';
          const url = isTV
            ? `${mirror}/providers=${providers}/stream/series/${finalImdbId}:${season}:${episode}.json`
            : `${mirror}/providers=${providers}/stream/movie/${finalImdbId}.json`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) continue;
          const data = await response.json();

          if (data.streams && data.streams.length > 0) {
            const hindiStreams = data.streams.filter((s: any) => {
              const title = s.title.toLowerCase();
              return title.includes('hindi') ||
                     title.includes('dual') ||
                     title.includes('dubbed') ||
                     (title.includes('audio') && title.includes('hi'));
            });

            bestStream = hindiStreams.length > 0 ? hindiStreams[0] : data.streams[0];

            if (bestStream) {
               const hash = bestStream.infoHash || (bestStream.url?.match(/btih:([a-fA-F0-9]+)/)?.[1]);
               if (hash) {
                  const trackers = "&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://9.rarbg.com:2810/announce&tr=udp://exodus.desync.com:6969/announce";
                  const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(bestStream.title.split('\n')[0])}${trackers}`;
                  setTorrentData({ magnet, title: bestStream.title });
               } else if (bestStream.url?.startsWith('magnet:')) {
                  setTorrentData({ magnet: bestStream.url, title: bestStream.title });
               }
            }
          }
        } catch (error) {
          console.warn(`Torrentio mirror ${mirror} failed`);
        }
      }

      setIsTorrentLoading(false);
    };

    if (finalImdbId) {
      fetchTorrent();
    }
  }, [finalImdbId, isTV, season, episode]);

  // YTS API Integration
  useEffect(() => {
    const fetchYts = async () => {
      if (!finalImdbId || isTV) return;
      setIsYtsLoading(true);
      setYtsData(null);

      try {
        const response = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${finalImdbId}`);
        const data = await response.json();

        if (data.status === 'ok' && data.data.movie_count > 0) {
          const movie = data.data.movies[0];
          const bestTorrent = movie.torrents.reduce((prev: any, current: any) => {
            return (prev.size_bytes > current.size_bytes) ? prev : current;
          });

          if (bestTorrent) {
            const trackers = "&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce";
            const magnet = `magnet:?xt=urn:btih:${bestTorrent.hash}&dn=${encodeURIComponent(movie.title)}&xl=${bestTorrent.size}${trackers}`;
            setYtsData({ magnet, title: `${movie.title} [${bestTorrent.quality}] [YTS]` });
          }
        }
      } catch (error) {
        console.warn("YTS API error:", error);
      } finally {
        setIsYtsLoading(false);
      }
    };

    fetchYts();
  }, [finalImdbId, isTV]);

  const getEmbedUrl = () => {
    if (selectedServer === 'torrent' && torrentData?.magnet) {
      const encodedMagnet = encodeURIComponent(torrentData.magnet);
      return `https://b-cdn.net/${encodedMagnet}`;
    }

    if (!tmdbId && !finalImdbId) return '';

    const idForEmbed = finalImdbId || tmdbId;

    if (isTV) {
      switch (selectedServer) {
        case 'torrent':
          return `https://embed.su/embed/tv/${idForEmbed}/${season}/${episode}`;
        case 'server1':
          return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        case 'server2':
          return `https://vidspark.to/tv/${tmdbId}/${season}/${episode}`;
        default:
          return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
    } else {
      switch (selectedServer) {
        case 'torrent':
          return `https://embed.su/embed/movie/${idForEmbed}`;
        case 'server1':
          return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
        case 'server2':
          return `https://vidspark.to/movie/${tmdbId}`;
        default:
          return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      }
    }
  };

  const isTorrentFallback = selectedServer === 'torrent' && !torrentData?.magnet;

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
          <Button 
            onClick={handleBack}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="hidden md:inline">Back to Detail</span>
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
                <p className="text-white font-medium">Fetching best Hindi torrent stream...</p>
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
                sandbox={isTorrentFallback ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock" : undefined}
              ></iframe>
            )}

            {/* Disclaimer overlay */}
            <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-gray-400 border border-white/10 uppercase tracking-widest font-black">
                {selectedServer === 'torrent' ? 'Premium Torrent Server (Hindi Priority)' : selectedServer === 'server1' ? 'Server 1: Multi-Audio' : 'Server 2: High Quality'}
               </span>
            </div>
          </div>

          {/* Multi-Source Download Section */}
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Download className="w-6 h-6 text-orange-500" />
              Download Options
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Button 1: Torrentio (Hindi) */}
              <div className="space-y-2">
                <Button
                  disabled={!torrentData?.magnet || isTorrentLoading}
                  onClick={() => torrentData?.magnet && window.open(torrentData.magnet, '_self')}
                  className={`w-full h-16 relative overflow-hidden group transition-all duration-300 ${
                    torrentData?.magnet
                      ? 'bg-gradient-to-br from-orange-600 to-red-700 hover:scale-105 shadow-[0_0_20px_rgba(234,88,12,0.3)]'
                      : 'bg-gray-800 opacity-50 cursor-not-allowed'
                  } border-none rounded-2xl flex flex-col items-center justify-center`}
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span className="font-bold text-sm">Download via Torrentio</span>
                  </div>
                  <span className="text-[10px] opacity-80 font-black uppercase tracking-tighter text-white">Hindi Dubbed Priority</span>
                </Button>
                {isTorrentLoading && <p className="text-[10px] text-gray-500 text-center animate-pulse">Searching Torrentio mirrors...</p>}
              </div>

              {/* Button 2: YTS (Dual Audio/Original) */}
              {!isTV && (
                <div className="space-y-2">
                  <Button
                    disabled={!ytsData?.magnet || isYtsLoading}
                    onClick={() => ytsData?.magnet && window.open(ytsData.magnet, '_self')}
                    className={`w-full h-16 relative overflow-hidden group transition-all duration-300 ${
                      ytsData?.magnet
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                        : 'bg-gray-800 opacity-50 cursor-not-allowed'
                    } border-none rounded-2xl flex flex-col items-center justify-center`}
                  >
                    <div className="flex items-center gap-2">
                      <Film className="w-5 h-5" />
                      <span className="font-bold text-sm">Download via YTS</span>
                    </div>
                    <span className="text-[10px] opacity-80 font-black uppercase tracking-tighter text-white">Dual Audio / High Quality</span>
                  </Button>
                  {isYtsLoading && <p className="text-[10px] text-gray-500 text-center animate-pulse">Checking YTS database...</p>}
                </div>
              )}

              {/* Button 3: Direct Download (VidSrc) */}
              <div className="space-y-2">
                <Button
                  onClick={() => window.open(`https://vidsrc.to/download/${isTV ? 'tv' : 'movie'}/${finalImdbId || tmdbId}`, '_blank')}
                  className="w-full h-16 bg-gradient-to-br from-green-600 to-emerald-700 hover:scale-105 shadow-[0_0_20px_rgba(22,163,74,0.3)] border-none rounded-2xl flex flex-col items-center justify-center transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <span className="font-bold text-sm">Direct Download</span>
                  </div>
                  <span className="text-[10px] opacity-80 font-black uppercase tracking-tighter text-white">Multi-Audio / Fast</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Controls & Server Switcher */}
          <div className="mt-6 flex flex-col md:flex-row gap-6 items-start justify-between bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold">Select Server</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setSelectedServer('torrent')}
                  variant={selectedServer === 'torrent' ? 'default' : 'outline'}
                  className={selectedServer === 'torrent' ? 'bg-orange-600 hover:bg-orange-700' : 'border-white/10 hover:bg-white/5'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Torrent Stream (Hindi)
                </Button>
                <Button
                  onClick={() => setSelectedServer('server1')}
                  variant={selectedServer === 'server1' ? 'default' : 'outline'}
                  className={selectedServer === 'server1' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}
                >
                  <Server className="w-4 h-4 mr-2" />
                  Server 1 (Hindi)
                </Button>
                <Button
                  onClick={() => setSelectedServer('server2')}
                  variant={selectedServer === 'server2' ? 'default' : 'outline'}
                  className={selectedServer === 'server2' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}
                >
                  <Server className="w-4 h-4 mr-2" />
                  Server 2
                </Button>
              </div>
              <p className="text-xs text-gray-500 italic">
                Tip: Torrent Stream prioritizes Hindi/Dual Audio. If no Hindi version is found, it defaults to the highest quality original audio.
              </p>
            </div>

            {isTV && (
              <div className="w-full md:w-auto space-y-4">
                <div className="flex items-center gap-3">
                  <List className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold">Episodes</h2>
                </div>
                <div className="flex gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black ml-1">Season</label>
                    <Select value={season.toString()} onValueChange={(v) => setSeason(parseInt(v))}>
                      <SelectTrigger className="w-24 bg-black/40 border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="S1" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10 text-white">
                        {[...Array(20)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>S {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black ml-1">Episode</label>
                    <Select value={episode.toString()} onValueChange={(v) => setEpisode(parseInt(v))}>
                      <SelectTrigger className="w-24 bg-black/40 border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="E1" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10 text-white">
                        {[...Array(50)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>E {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-4">
            <div className="bg-yellow-500/20 p-2 rounded-xl">
              <Layout className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h4 className="text-yellow-500 font-bold text-sm">Player Optimization</h4>
              <p className="text-gray-400 text-xs mt-1">
                We've optimized the player for all browsers. If the video doesn't play, please try switching between Torrent Stream, Server 1, or 2.
              </p>
            </div>
          </div>

          {/* Related Content */}
          <div className="mt-16">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                More Like This
            </h2>
            {relatedContent && relatedContent.length > 0 ? (
              <div className="relative">
                <Carousel
                  opts={{
                    align: "start",
                    slidesToScroll: 2,
                  }}
                  className="w-full"
                >
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
