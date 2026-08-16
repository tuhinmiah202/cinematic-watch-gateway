import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Hls from 'hls.js';
import { movieboxService, normalizeSource, MBItem } from '@/services/movieboxService';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Download, Globe } from 'lucide-react';

interface Props {
  title: string;
  year?: string | number | null;
  isTV: boolean;
  season?: number;
  episode?: number;
  poster?: string;
}

const LANG_RE = /\[([^\]]+)\]|\(([^)]+)\)/g;

const languageOf = (name: string) => {
  const tags: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = LANG_RE.exec(name))) tags.push((m[1] || m[2]).trim());
  const known = ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Urdu', 'Malayalam', 'Kannada', 'Punjabi', 'Marathi', 'Korean', 'Japanese', 'Chinese', 'Spanish', 'Arabic', 'Dual Audio', 'Multi Audio'];
  const hit = tags.find((t) => known.some((k) => t.toLowerCase() === k.toLowerCase()));
  if (hit) return hit;
  const inline = known.find((k) => new RegExp(`\\b${k}\\b`, 'i').test(name));
  return inline || 'Original';
};

const normalizeTitle = (s: string) =>
  s.toLowerCase().replace(/\[[^\]]*\]|\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const MovieBoxPlayer = ({ title, year, isTV, season = 1, episode = 1, poster }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const { data: matches = [], isLoading: loadingSearch } = useQuery({
    queryKey: ['mb-match', title, isTV],
    queryFn: async () => {
      const res = await movieboxService.search(title);
      const wanted = normalizeTitle(title);
      const type = isTV ? 2 : 1;
      return (res.items || []).filter((i) => {
        if (i.subject_type && i.subject_type !== type) return false;
        const n = normalizeTitle(i.name);
        return n === wanted || n.startsWith(wanted) || wanted.startsWith(n);
      });
    },
    enabled: !!title,
  });

  const variants = useMemo(() => {
    const seen = new Set<string>();
    return matches.filter((i) => {
      const lang = languageOf(i.name);
      if (seen.has(lang)) return false;
      seen.add(lang);
      return true;
    });
  }, [matches]);

  useEffect(() => {
    if (!selectedId && variants.length) {
      const hindi = variants.find((v) => languageOf(v.name) === 'Hindi');
      setSelectedId((hindi || variants[0]).subject_id);
    }
  }, [variants, selectedId]);

  const selected: MBItem | undefined = variants.find((v) => v.subject_id === selectedId) || variants[0];

  const { data: stream, isLoading: loadingStream } = useQuery({
    queryKey: ['mb-stream-embed', selected?.subject_id, selected?.slug, isTV, season, episode],
    queryFn: () =>
      movieboxService.getStream(selected!.subject_id, selected!.slug, isTV ? season : 0, isTV ? episode : 1),
    enabled: !!selected?.subject_id,
  });

  const playables = useMemo(() => {
    if (!stream) return [] as { url: string; kind: string; resolution?: number | string }[];
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
    video.play().catch(() => {});
    return () => hls?.destroy();
  }, [activeUrl]);

  const mp4 = playables.find((p) => p.kind === 'MP4');
  const busy = loadingSearch || loadingStream;

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10">
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : activeUrl ? (
          <video ref={videoRef} controls autoPlay playsInline poster={poster} className="w-full h-full" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-md">
              {matches.length === 0
                ? 'This title was not found on your MovieBox API server.'
                : stream?.note || 'Your API server returned no playable source for this title yet.'}
            </p>
          </div>
        )}
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase font-black tracking-widest text-muted-foreground">
            <Globe className="w-4 h-4" /> Audio / Version
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <Button
                key={v.subject_id}
                size="sm"
                variant={selected?.subject_id === v.subject_id ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setSelectedId(v.subject_id)}
              >
                {languageOf(v.name)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {playables.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {playables.map((s, i) => (
            <Button
              key={`${s.url}-${i}`}
              size="sm"
              variant={activeUrl === s.url ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveUrl(s.url)}
            >
              {s.kind} {s.resolution ? String(s.resolution).replace(/p?$/, 'p') : ''}
            </Button>
          ))}
        </div>
      )}

      {mp4 && (
        <a href={mp4.url} target="_blank" rel="noopener noreferrer" download>
          <Button className="rounded-full">
            <Download className="w-4 h-4 mr-2" /> Download ({mp4.resolution ? String(mp4.resolution).replace(/p?$/, 'p') : 'MP4'})
          </Button>
        </a>
      )}
    </div>
  );
};

export default MovieBoxPlayer;
