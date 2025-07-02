
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { contentService } from '@/services/contentService';
import { useToast } from '@/hooks/use-toast';

interface EditContentDialogProps {
  content: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditContentDialog = ({ content, isOpen, onClose, onSave }: EditContentDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    release_year: '',
    rating: '',
    runtime: '',
    cast_members: [] as string[],
    streaming_links: [] as { url: string; platform_name: string }[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newCastMember, setNewCastMember] = useState('');
  const [newStreamingUrl, setNewStreamingUrl] = useState('');
  const [newPlatformName, setNewPlatformName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        description: content.description || '',
        release_year: content.release_year?.toString() || '',
        rating: content.rating?.toString() || '',
        runtime: content.runtime?.toString() || '',
        cast_members: content.cast_members?.map((member: any) => 
          typeof member === 'string' ? member : member.name
        ) || [],
        streaming_links: content.streaming_links?.map((link: any) => ({
          url: link.url,
          platform_name: link.platform_name || 'Custom'
        })) || []
      });
    }
  }, [content]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCastMember = () => {
    if (newCastMember.trim()) {
      setFormData(prev => ({
        ...prev,
        cast_members: [...prev.cast_members, newCastMember.trim()]
      }));
      setNewCastMember('');
    }
  };

  const handleRemoveCastMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cast_members: prev.cast_members.filter((_, i) => i !== index)
    }));
  };

  const handleAddStreamingLink = () => {
    if (newStreamingUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        streaming_links: [...prev.streaming_links, {
          url: newStreamingUrl.trim(),
          platform_name: newPlatformName.trim() || 'Custom'
        }]
      }));
      setNewStreamingUrl('');
      setNewPlatformName('');
    }
  };

  const handleRemoveStreamingLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      streaming_links: prev.streaming_links.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      console.log('Saving content with data:', formData);
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        release_year: formData.release_year ? parseInt(formData.release_year) : undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        runtime: formData.runtime ? parseInt(formData.runtime) : undefined,
      };

      console.log('Update data being sent:', updateData);
      
      await contentService.updateContent(content.id, updateData);
      
      if (formData.streaming_links.length > 0) {
        for (const link of formData.streaming_links) {
          await contentService.addStreamingLink(content.id, link.url, link.platform_name);
        }
      }
      
      if (formData.cast_members.length > 0) {
        await contentService.addCastToContent(content.id, 
          formData.cast_members.map(name => ({ name }))
        );
      }
      
      toast({
        title: "Success",
        description: "Content updated successfully"
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Edit {content?.content_type === 'series' ? 'Series' : 'Movie'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description">Overview</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="bg-gray-800 border-gray-600 text-white resize-none"
              placeholder="Enter movie/series overview..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="release_year">Release Year</Label>
              <Input
                id="release_year"
                type="number"
                value={formData.release_year}
                onChange={(e) => handleInputChange('release_year', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="rating">Rating (1-10)</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="runtime">Runtime (minutes)</Label>
            <Input
              id="runtime"
              type="number"
              value={formData.runtime}
              onChange={(e) => handleInputChange('runtime', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label>Streaming Links</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newStreamingUrl}
                  onChange={(e) => setNewStreamingUrl(e.target.value)}
                  placeholder="Streaming URL..."
                  className="bg-gray-800 border-gray-600 text-white flex-1"
                />
                <Input
                  value={newPlatformName}
                  onChange={(e) => setNewPlatformName(e.target.value)}
                  placeholder="Platform name..."
                  className="bg-gray-800 border-gray-600 text-white w-32"
                />
                <Button onClick={handleAddStreamingLink} type="button" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {formData.streaming_links.map((link, index) => (
                  <div key={index} className="bg-gray-700 px-3 py-2 rounded flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.platform_name}</p>
                      <p className="text-xs text-gray-300 truncate">{link.url}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveStreamingLink(index)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Cast Members</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newCastMember}
                onChange={(e) => setNewCastMember(e.target.value)}
                placeholder="Add cast member..."
                className="bg-gray-800 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCastMember()}
              />
              <Button onClick={handleAddCastMember} type="button" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.cast_members.map((member, index) => (
                <div key={index} className="bg-gray-700 px-2 py-1 rounded text-sm flex items-center gap-2">
                  {member}
                  <button
                    onClick={() => handleRemoveCastMember(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditContentDialog;
