
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Trash2, ExternalLink, Edit3, Save, X, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { contentService, ContentItem } from '@/services/contentService';
import { adminService } from '@/services/adminService';

const AdminManage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStreamingLink, setEditStreamingLink] = useState('');
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [seriesSearchQuery, setSeriesSearchQuery] = useState('');
  
  // Edit form states
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    release_year: '',
    rating: '',
    runtime: '',
    cast: '',
  });

  // Fetch content from Supabase
  const { data: managedContent = [], isLoading } = useQuery({
    queryKey: ['admin-content'],
    queryFn: () => adminService.getAllContent()
  });

  const handleRemoveContent = async (id: string, title: string) => {
    const success = await adminService.deleteContent(id);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast({
        title: "Content Removed",
        description: `${title} has been removed from the platform.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStreamingLink = async (id: string, title: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Streaming link removal will be available soon.",
    });
  };

  const handleEditStreamingLink = (id: string, currentLink: string) => {
    setEditingId(id);
    setEditStreamingLink(currentLink);
  };

  const handleAddStreamingLink = (id: string) => {
    setEditingId(id);
    setEditStreamingLink('');
  };

  const handleSaveStreamingLink = async (id: string) => {
    if (!editStreamingLink.trim()) {
      toast({
        title: "Invalid Link",
        description: "Please enter a valid streaming link.",
        variant: "destructive",
      });
      return;
    }

    const success = await adminService.addStreamingLink(id, editStreamingLink.trim());
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast({
        title: "Streaming Link Updated",
        description: "The streaming link has been updated successfully.",
      });
      setEditingId(null);
      setEditStreamingLink('');
    } else {
      toast({
        title: "Error",
        description: "Failed to update streaming link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStreamingLink('');
    setEditingContentId(null);
    setEditForm({
      title: '',
      description: '',
      release_year: '',
      rating: '',
      runtime: '',
      cast: '',
    });
  };

  const handleEditContent = (content: ContentItem) => {
    setEditingContentId(content.id);
    setEditForm({
      title: content.title,
      description: content.description || '',
      release_year: content.release_year?.toString() || '',
      rating: '0', // We'll need to add rating field to database
      runtime: '0', // We'll need to add runtime field to database
      cast: content.cast_members?.map(c => c.name).join(', ') || '',
    });
  };

  const handleSaveContentEdit = async () => {
    if (!editingContentId) return;

    const updates = {
      title: editForm.title,
      description: editForm.description,
      release_year: editForm.release_year ? parseInt(editForm.release_year) : undefined,
    };

    const success = await adminService.updateContent(editingContentId, updates);
    
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast({
        title: "Content Updated",
        description: "The content has been updated successfully.",
      });
      handleCancelEdit();
    } else {
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const movies = managedContent.filter(item => item.content_type === 'movie');
  const series = managedContent.filter(item => item.content_type === 'series');

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(movieSearchQuery.toLowerCase())
  );

  const filteredSeries = series.filter(seriesItem =>
    seriesItem.title.toLowerCase().includes(seriesSearchQuery.toLowerCase())
  );

  const renderContentItem = (item: ContentItem) => {
    const streamingLink = item.streaming_links?.[0]?.url || '';
    const isEditingContent = editingContentId === item.id;
    
    return (
      <div key={item.id} className="bg-gray-700 rounded-lg p-4">
        {isEditingContent ? (
          // Edit form
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="bg-gray-600 border-gray-500 text-white"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium">Overview</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="bg-gray-600 border-gray-500 text-white"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium">Release Year</label>
                <Input
                  type="number"
                  value={editForm.release_year}
                  onChange={(e) => setEditForm({...editForm, release_year: e.target.value})}
                  className="bg-gray-600 border-gray-500 text-white"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium">Rating</label>
                <Input
                  type="number"
                  step="0.1"
                  max="10"
                  value={editForm.rating}
                  onChange={(e) => setEditForm({...editForm, rating: e.target.value})}
                  className="bg-gray-600 border-gray-500 text-white"
                  placeholder="0.0 - 10.0"
                />
              </div>
            </div>
            <div>
              <label className="text-white text-sm font-medium">Runtime (minutes)</label>
              <Input
                type="number"
                value={editForm.runtime}
                onChange={(e) => setEditForm({...editForm, runtime: e.target.value})}
                className="bg-gray-600 border-gray-500 text-white"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium">Cast (comma separated)</label>
              <Input
                value={editForm.cast}
                onChange={(e) => setEditForm({...editForm, cast: e.target.value})}
                className="bg-gray-600 border-gray-500 text-white"
                placeholder="Actor 1, Actor 2, Actor 3"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveContentEdit}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Display mode
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-white font-semibold">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.release_year}</p>
              {item.description && (
                <p className="text-gray-300 text-sm mt-1 line-clamp-2">{item.description}</p>
              )}
              
              {/* Streaming Link Section */}
              <div className="mt-2">
                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editStreamingLink}
                      onChange={(e) => setEditStreamingLink(e.target.value)}
                      className="bg-gray-600 border-gray-500 text-white text-xs"
                      placeholder="Enter streaming link"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveStreamingLink(item.id)}
                      className="bg-green-600 hover:bg-green-700 px-2"
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCancelEdit}
                      className="bg-gray-600 hover:bg-gray-700 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-xs truncate max-w-xs">
                      {streamingLink || 'No streaming link'}
                    </span>
                    {streamingLink ? (
                      <Button
                        size="sm"
                        onClick={() => handleEditStreamingLink(item.id, streamingLink)}
                        className="bg-blue-600 hover:bg-blue-700 px-2 ml-2"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddStreamingLink(item.id)}
                        className="bg-green-600 hover:bg-green-700 px-2 ml-2"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleEditContent(item)}
                className="bg-blue-600 hover:bg-blue-700"
                title="Edit content details"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              {streamingLink && (
                <Button
                  size="sm"
                  onClick={() => handleRemoveStreamingLink(item.id, item.title)}
                  className="bg-orange-600 hover:bg-orange-700 text-xs"
                  title="Remove streaming link only"
                >
                  Remove Link
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleRemoveContent(item.id, item.title)}
                className="bg-red-600 hover:bg-red-700"
                title="Remove entire content"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="outline" size="sm" className="text-white border-white/20">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Manage Content</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{movies.length}</div>
                <div className="text-sm text-gray-400">Movies</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{series.length}</div>
                <div className="text-sm text-gray-400">Series</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{managedContent.length}</div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Movies Section */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Movies ({filteredMovies.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search movies..."
                  value={movieSearchQuery}
                  onChange={(e) => setMovieSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMovies.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                {movieSearchQuery ? 'No movies found matching your search.' : 'No movies added yet.'}
              </p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {filteredMovies.map(renderContentItem)}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Series Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Series ({filteredSeries.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search series..."
                  value={seriesSearchQuery}
                  onChange={(e) => setSeriesSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSeries.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                {seriesSearchQuery ? 'No series found matching your search.' : 'No series added yet.'}
              </p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {filteredSeries.map(renderContentItem)}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminManage;
