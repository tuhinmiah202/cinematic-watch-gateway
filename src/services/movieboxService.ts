const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://moviebox-api-steel.vercel.app';

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
    const data = await request<{ data: any }>(`/detail/${slug}`);
    return data?.data || null;
  },

  async getStream(subjectId: string, detailPath: string, se = 0, ep = 1): Promise<MBStream> {
    return request(
      `/api/stream/${subjectId}?detail_path=${encodeURIComponent(detailPath)}&se=${se}&ep=${ep}`
    );
  },

  async getCaptions(subjectId: string, detailPath: string): Promise<any> {
    return request(`/api/stream/${subjectId}/captions?detail_path=${encodeURIComponent(detailPath)}`);
  },
};
