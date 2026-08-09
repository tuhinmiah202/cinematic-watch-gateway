import { supabase } from '@/integrations/supabase/client';

export interface ContentOverride {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string | null;
  hindi_stream_url: string | null;
  download_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const overrideService = {
  async getOverride(tmdbId?: number | string | null, mediaType: 'movie' | 'tv' = 'movie') {
    if (tmdbId === null || tmdbId === undefined) return null;
    const numericId = Number(tmdbId);
    if (!Number.isFinite(numericId) || numericId <= 0) return null;

    const { data, error } = await supabase
      .from('content_overrides')
      .select('*')
      .eq('tmdb_id', numericId)
      .eq('media_type', mediaType)
      .maybeSingle();

    if (error) {
      console.error('Error fetching content override:', error);
      return null;
    }
    return (data as ContentOverride) || null;
  },

  async listOverrides() {
    const { data, error } = await supabase
      .from('content_overrides')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error listing content overrides:', error);
      return [];
    }
    return (data as ContentOverride[]) || [];
  },

  async upsertOverride(payload: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title?: string | null;
    hindi_stream_url?: string | null;
    download_url?: string | null;
    notes?: string | null;
  }) {
    const { data, error } = await supabase
      .from('content_overrides')
      .upsert(payload, { onConflict: 'tmdb_id,media_type' })
      .select()
      .single();

    if (error) throw error;
    return data as ContentOverride;
  },

  async deleteOverride(id: string) {
    const { error } = await supabase.from('content_overrides').delete().eq('id', id);
    if (error) throw error;
  }
};

/**
 * Build embed URLs for the known providers, adding the audio-language
 * parameter each provider understands when Hindi is requested.
 */
export const buildEmbedUrl = (
  provider: 'vidsrc' | 'vidsrccc' | 'vidlink' | 'vidsrcme',
  tmdbId: number | string,
  isTV: boolean,
  lang: 'hi' | 'en'
) => {
  const kind = isTV ? 'tv' : 'movie';
  const hindi = lang === 'hi';

  switch (provider) {
    case 'vidsrc':
      return `https://vidsrc.to/embed/${kind}/${tmdbId}${hindi ? '?ds_lang=hi' : ''}`;
    case 'vidsrccc':
      return `https://vidsrc.cc/v2/embed/${kind}/${tmdbId}${hindi ? '?lang=hi' : ''}`;
    case 'vidlink':
      return `https://vidlink.pro/${kind}/${tmdbId}${hindi ? '?player=default&sub=hi&dub=hi' : ''}`;
    case 'vidsrcme':
    default:
      return `https://vidsrc.me/embed/${kind}?tmdb=${tmdbId}${hindi ? '&ds_lang=hi' : ''}`;
  }
};
