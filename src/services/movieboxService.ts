const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://moviebox-api-steel.vercel.app';
// Streaming resolver (the Vercel deployment currently returns no playable sources).
// The upstream sends no CORS headers, so JSON calls go through our edge function proxy.
const STREAM_BASE = import.meta.env.VITE_STREAM_BASE_URL || 'https://hdmoviebox.fly.dev';
const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moviebox`;

export interface MBItem {
  name: string;
  poster_url?: string;
  image_url?: string;
  slug: string;
  subject_id: string;
  rating?: string;
  year?: string;
  genre?: string;
  country?: string;
  badge?: string;
  subject_type?: number;
}

export interface MBSection {
  section: string;
  count: number;
  items: MBItem[];
}

export interface MBStreamSource {
  url: string;
  resolution?: number | string;
  format?: string;
  size?: number;
}

export interface MBStream {
  subject_id: string;
  se: number;
  ep: number;
  has_resource: boolean;
  sources: MBStreamSource[];
  hls: (string | MBStreamSource)[];
  dash: (string | MBStreamSource)[];
  note?: string;
}

const request = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`MovieBox API error ${res.status}`);
  return res.json();
};

export const normalizeSource = (s: string | MBStreamSource): MBStreamSource =>
  typeof s === 'string' ? { url: s } : s;

export const movieboxService = {
  apiBase: API_BASE,

  async getHome(): Promise<MBSection[]> {
    const data = await request<{ sections: MBSection[] }>('/home');
    return data.sections || [];
  },

  async getMovies(page = 1): Promise<{ items: MBItem[]; has_more: boolean }> {
    return request(`/movies?page=${page}`);
  },

  async getSeries(page = 1): Promise<{ items: MBItem[]; has_more: boolean }> {
    return request(`/tv-series?page=${page}`);
  },

  async search(query: string, page = 1): Promise<{ items: MBItem[]; total: number }> {
    return request(`/search?q=${encodeURIComponent(query)}&page=${page}`);
  },

  async getDetail(slug: string): Promise<any> {
    try {
      const data = await request<{ data: any }>(`/detail/${slug}`);
      if (data?.data?.subject) return data.data;
    } catch {
      /* fall through to backup resolver */
    }

    // Backup: find the subject via search, then use the streaming server's detail endpoint
    const guess = slug.replace(/-[A-Za-z0-9]{6,}$/, '').replace(/-/g, ' ');
    try {
      const found = await movieboxService.search(guess);
      const hit = (found.items || []).find((i) => i.slug === slug) || (found.items || [])[0];
      if (!hit) return null;
      const alt = await fetch(
        `${EDGE_BASE}?action=detail&subject_id=${hit.subject_id}&slug=${encodeURIComponent(slug)}`
      ).then((r) => (r.ok ? r.json() : null));
      return {
        subject: {
          subjectId: hit.subject_id,
          subjectType: hit.subject_type || (alt?.type === 'tv' ? 2 : 1),
          title: alt?.title || hit.name,
          description: alt?.overview || '',
          cover: { url: hit.poster_url || hit.image_url || alt?.poster || '' },
          imdbRatingValue: hit.rating || alt?.rating,
          releaseDate: hit.year || alt?.year,
          genre: hit.genre || (alt?.genres || []).join(', '),
          countryName: hit.country || alt?.country,
        },
        resource: alt?.resource || {},
      };
    } catch {
      return null;
    }
  },


  proxy(url: string) {
    if (!url) return url;
    return `${STREAM_BASE}/api/proxy?url=${encodeURIComponent(url)}`;
  },

  async getStream(subjectId: string, detailPath: string, se = 0, ep = 1): Promise<MBStream> {
    const slug = (detailPath || '').split('/').filter(Boolean).pop() || detailPath;
    // Movies on MovieBox are indexed as se=0&ep=0; series use real se/ep.
    const attempts: [number, number][] = se > 0 ? [[se, ep]] : [[0, 0], [0, 1]];

    for (const [s, e] of attempts) {
      try {
        const res = await fetch(
          `${EDGE_BASE}?action=stream&subject_id=${subjectId}&slug=${encodeURIComponent(slug)}&se=${s}&ep=${e}`
        );
        if (res.ok) {
          const data = (await res.json()) as MBStream;
          if (data?.has_resource) {
            const sources = (data.sources || [])
              .filter((x) => !!x.url)
              .map((x) => ({ ...x, url: movieboxService.proxy(x.url) }));
            const hls = (data.hls || [])
              .map(normalizeSource)
              .filter((x) => !!x.url)
              .map((x) => ({ ...x, url: movieboxService.proxy(x.url) }));
            return { ...data, sources, hls };
          }
        }
      } catch {
        /* try next */
      }
    }

    // Fallback to the primary API server
    return request(
      `/api/stream/${subjectId}?detail_path=${encodeURIComponent(detailPath)}&se=${se}&ep=${ep}`
    );
  },

  async getCaptions(subjectId: string, detailPath: string): Promise<any> {
    return request(`/api/stream/${subjectId}/captions?detail_path=${encodeURIComponent(detailPath)}`);
  },
};

