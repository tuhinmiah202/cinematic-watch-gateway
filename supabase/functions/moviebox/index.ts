// Server-side proxy for the MovieBox streaming resolver (upstream sends no CORS headers)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const STREAM_BASE = 'https://hdmoviebox.fly.dev';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'stream';
    const subjectId = url.searchParams.get('subject_id') || '';
    const slug = url.searchParams.get('slug') || '';

    let target: string;
    if (action === 'detail') {
      target = `${STREAM_BASE}/api/detail?type=moviebox&id=${subjectId}&source=moviebox&slug=${encodeURIComponent(slug)}`;
    } else if (action === 'search') {
      target = `${STREAM_BASE}/api/search?q=${encodeURIComponent(url.searchParams.get('q') || '')}`;
    } else {
      const se = url.searchParams.get('se') || '0';
      const ep = url.searchParams.get('ep') || '0';
      target = `${STREAM_BASE}/api/stream?subject_id=${subjectId}&slug=${encodeURIComponent(slug)}&se=${se}&ep=${ep}`;
    }

    const res = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const body = await res.text();

    return new Response(body, {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
