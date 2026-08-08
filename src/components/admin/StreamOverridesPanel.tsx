import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { overrideService } from '@/services/overrideService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Trash2, Languages } from 'lucide-react';

const StreamOverridesPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tmdbId, setTmdbId] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [title, setTitle] = useState('');
  const [hindiUrl, setHindiUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ['content-overrides'],
    queryFn: () => overrideService.listOverrides()
  });

  const reset = () => {
    setTmdbId('');
    setTitle('');
    setHindiUrl('');
    setDownloadUrl('');
    setMediaType('movie');
  };

  const handleSave = async () => {
    const id = Number(tmdbId);
    if (!Number.isFinite(id) || id <= 0) {
      toast({ title: 'Invalid TMDB ID', description: 'Enter a valid numeric TMDB ID.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await overrideService.upsertOverride({
        tmdb_id: id,
        media_type: mediaType,
        title: title.trim() || null,
        hindi_stream_url: hindiUrl.trim() || null,
        download_url: downloadUrl.trim() || null
      });
      toast({ title: 'Saved', description: 'Links updated for this title.' });
      reset();
      queryClient.invalidateQueries({ queryKey: ['content-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['content-override'] });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await overrideService.deleteOverride(id);
      queryClient.invalidateQueries({ queryKey: ['content-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['content-override'] });
      toast({ title: 'Deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Languages className="w-5 h-5 text-red-500" /> Hindi Stream & Download Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">TMDB ID</Label>
              <Input value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} placeholder="e.g. 969681" className="bg-black/40 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Type</Label>
              <Select value={mediaType} onValueChange={(v) => setMediaType(v as 'movie' | 'tv')}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="tv">TV Series</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For your reference" className="bg-black/40 border-white/10 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">Hindi Stream URL (embed / iframe link)</Label>
            <Input value={hindiUrl} onChange={(e) => setHindiUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-white/10 text-white" />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">Direct Download URL</Label>
            <Input value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-white/10 text-white" />
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Links
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="text-white">Saved Links ({overrides.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
          {!isLoading && overrides.length === 0 && <p className="text-gray-500 text-sm">No links added yet.</p>}
          {overrides.map((o) => (
            <div key={o.id} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="min-w-0 space-y-1">
                <p className="text-white font-bold text-sm truncate">{o.title || `TMDB ${o.tmdb_id}`} <span className="text-gray-500 font-normal">({o.media_type})</span></p>
                <p className="text-[11px] text-gray-500 truncate">Hindi: {o.hindi_stream_url || '—'}</p>
                <p className="text-[11px] text-gray-500 truncate">Download: {o.download_url || '—'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTmdbId(String(o.tmdb_id));
                    setMediaType(o.media_type === 'tv' ? 'tv' : 'movie');
                    setTitle(o.title || '');
                    setHindiUrl(o.hindi_stream_url || '');
                    setDownloadUrl(o.download_url || '');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(o.id)} className="text-red-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamOverridesPanel;
