import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Hls from 'hls.js';
import { movieboxService, normalizeSource } from '@/services/movieboxService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Star, Download, AlertCircle } from 'lucide-react';

const MovieBoxDetail = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [season, setSeason] = useState(0);
  const [episode, setEpisode] = useState(1);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['mb-detail', slug],
    queryFn: () => movieboxService.getDetail(slug),
    enabled: !!slug,
  });

  const subject = detail?.subject;
  const subjectId = subject?.subjectId as string | undefined;
  const isSeries = subject?.subjectType === 2;
  const seasons = (detail?.resource?.seasons || []) as { se: number; maxEp: number }[];

  useEffect(() => {
    if (seasons.length && season === 0 && seasons[0].se > 0) setSeason(seasons[0].se);
  }, [seasons, season]);

  const { data: stream, isLoading: loadingStream } = useQuery({
    queryKey: ['mb-stream', subjectId, slug, season, episode],
    queryFn: () => movieboxService.getStream(subjectId!, slug, season, episode),
    enabled: !!subjectId,
  });

  const playables = useMemo(() => {
    if (!stream) return [];
    const hls = (stream.hls || []).map(normalizeSource).map((s) => ({ ...s, kind: 'HLS' }));
    const files = (stream.sources || []).map(normalizeSource).map((s) => ({ ...s, kind: 'MP4' }));
    return [...hls, ...files].filter((s) => !!s.url);
  }, [stream]);

  useEffect(() => {
    setActiveUrl(playables[0]?.url || null);
  }, [playables]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeUrl) return;

    let hls: Hls | null = null;
    if (activeUrl.includes('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeUrl;
      } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(activeUrl);
        hls.attachMedia(video);
      }
    } else {
      video.src = activeUrl;
    }
    return () => {
      hls?.destroy();
    };
  }, [activeUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-2xl font-bold">Content not found</h1>
        <Button onClick={() => navigate('/browse')}>Back to Browse</Button>
      </div>
    );
  }

  const maxEp = seasons.find((s) => s.se === season)?.maxEp || 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-6 space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="rounded-3xl overflow-hidden border border-white/10 bg-black aspect-video relative">
          {loadingStream ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : activeUrl ? (
            <video ref={videoRef} controls playsInline poster={subject?.cover?.url} className="w-full h-full" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {stream?.note || 'No playable source returned by the API for this title.'}
              </p>
              {subject?.trailer?.videoAddress?.url && (
                <Button onClick={() => setActiveUrl(subject.trailer.videoAddress.url)}>Play Trailer</Button>
              )}
            </div>
          )}
        </div>

        {playables.length > 1 && (
          <div className="flex flex-wrap gap-3">
            {playables.map((s, i) => (
              <Button
                key={`${s.url}-${i}`}
                variant={activeUrl === s.url ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setActiveUrl(s.url)}
              >
                {s.kind} {s.resolution ? String(s.resolution).replace(/p?$/, 'p') : ''}
              </Button>
            ))}
          </div>
        )}

        {isSeries && seasons.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-muted-foreground">Season</label>
              <Select value={String(season)} onValueChange={(v) => { setSeason(Number(v)); setEpisode(1); }}>
                <SelectTrigger className="w-40 h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s.se} value={String(s.se)}>Season {s.se}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {maxEp > 0 && (
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground">Episode</label>
                <Select value={String(episode)} onValueChange={(v) => setEpisode(Number(v))}>
                  <SelectTrigger className="w-40 h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Array.from({ length: maxEp }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>Episode {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <section className="grid md:grid-cols-[220px_1fr] gap-8">
          <img
            src={subject.cover?.url || '/placeholder.svg'}
            alt={`${subject.title} poster`}
            className="rounded-3xl w-full border border-white/10"
          />
          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-tight">{subject.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {subject.imdbRatingValue && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {subject.imdbRatingValue}
                </span>
              )}
              {subject.releaseDate && <span>{subject.releaseDate}</span>}
              {subject.genre && <span>{subject.genre}</span>}
              {subject.countryName && <span>{subject.countryName}</span>}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{subject.description}</p>

            {activeUrl && !activeUrl.includes('.m3u8') && (
              <a href={activeUrl} target="_blank" rel="noopener noreferrer" download>
                <Button className="rounded-full">
                  <Download className="w-4 h-4 mr-2" /> Download this file
                </Button>
              </a>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default MovieBoxDetail;
