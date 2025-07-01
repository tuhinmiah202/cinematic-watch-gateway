import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentService } from '@/services/contentService';
import { tmdbService } from '@/services/tmdbService';
import { useToast } from '@/hooks/use-toast';
import EditContentDialog from '@/components/admin/EditContentDialog';

const AdminManage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    posterUrl: '',
    releaseYear: '',
    contentType: 'movie' as 'movie' | 'series',
    tmdbId: '',
    streamingUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch existing content
  const { data: existingContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ['admin-content'],
    queryFn: contentService.getAllContent
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const searchTMDB = async () => {
    if (!formData.title.trim()) return;
    
    setIsSearching(true);
    try {
      const [movieResults, tvResults] = await Promise.all([
        tmdbService.searchMovies(formData.title),
        tmdbService.searchTVShows(formData.title)
      ]);
      
      const combined = [
        ...movieResults.results.map(item => ({ ...item, media_type: 'movie' })),
        ...tvResults.results.map(item => ({ ...item, media_type: 'tv' }))
      ].slice(0, 10);
      
      setSearchResults(combined);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search TMDB",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectFromTMDB = (item: any) => {
    setFormData({
      title: item.title || item.name,
      description: item.overview || '',
      posterUrl: tmdbService.getImageUrl(item.poster_path) || '',
      releaseYear: (item.release_date || item.first_air_date)?.split('-')[0] || '',
      contentType: item.media_type === 'tv' ? 'series' : 'movie',
      tmdbId: item.id.toString(),
      streamingUrl: ''
    });
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await contentService.addContent({
        title: formData.title,
        description: formData.description,
        poster_url: formData.posterUrl,
        release_year: parseInt(formData.releaseYear),
        content_type: formData.contentType,
        tmdb_id: parseInt(formData.tmdbId),
        streaming_links: formData.streamingUrl ? [{ url: formData.streamingUrl, platform: 'Custom' }] : []
      });
      
      toast({
        title: "Success",
        description: "Content added successfully"
      });
      
      setFormData({
        title: '',
        description: '',
        posterUrl: '',
        releaseYear: '',
        contentType: 'movie',
        tmdbId: '',
        streamingUrl: ''
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
    } catch (error) {
      console.error('Error adding content:', error);
      toast({
        title: "Error",
        description: "Failed to add content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (content: any) => {
    setEditingContent(content);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      await contentService.deleteContent(id);
      toast({
        title: "Success",
        description: "Content deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  const handleEditSave = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-content'] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/dashboard')}
            className="bg-black/50 text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-white">Manage Content</h1>
        </div>

        <Tabs defaultValue="add" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="add" className="text-white data-[state=active]:bg-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </TabsTrigger>
            <TabsTrigger value="existing" className="text-white data-[state=active]:bg-purple-600">
              Existing Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Add New Content</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white">Title</Label>
                    <div className="flex gap-2">
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Enter title or search TMDB..."
                        required
                      />
                      <Button 
                        type="button"
                        onClick={searchTMDB}
                        disabled={isSearching || !formData.title.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search TMDB'}
                      </Button>
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <h3 className="text-white font-semibold mb-2">Search Results:</h3>
                      <div className="space-y-2">
                        {searchResults.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500"
                            onClick={() => selectFromTMDB(item)}
                          >
                            <img
                              src={tmdbService.getImageUrl(item.poster_path) || '/placeholder.svg'}
                              alt={item.title || item.name}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <div>
                              <p className="text-white font-medium">{item.title || item.name}</p>
                              <p className="text-gray-300 text-sm">
                                {item.media_type === 'tv' ? 'TV Series' : 'Movie'} • 
                                {(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contentType" className="text-white">Content Type</Label>
                      <Select value={formData.contentType} onValueChange={(value: 'movie' | 'series') => handleInputChange('contentType', value)}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="movie">Movie</SelectItem>
                          <SelectItem value="series">TV Series</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="releaseYear" className="text-white">Release Year</Label>
                      <Input
                        id="releaseYear"
                        type="number"
                        value={formData.releaseYear}
                        onChange={(e) => handleInputChange('releaseYear', e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="1900"
                        max="2030"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="posterUrl" className="text-white">Poster URL</Label>
                    <Input
                      id="posterUrl"
                      value={formData.posterUrl}
                      onChange={(e) => handleInputChange('posterUrl', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="tmdbId" className="text-white">TMDB ID</Label>
                    <Input
                      id="tmdbId"
                      value={formData.tmdbId}
                      onChange={(e) => handleInputChange('tmdbId', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="123456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="streamingUrl" className="text-white">Streaming URL (Optional)</Label>
                    <Input
                      id="streamingUrl"
                      value={formData.streamingUrl}
                      onChange={(e) => handleInputChange('streamingUrl', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="https://..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Content...
                      </>
                    ) : (
                      'Add Content'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existing">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Existing Content</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingContent ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : existingContent && existingContent.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingContent.map((content: any) => (
                      <div key={content.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={content.poster_url || '/placeholder.svg'}
                            alt={content.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">{content.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {content.content_type === 'series' ? 'Series' : 'Movie'}
                              </Badge>
                              <span className="text-gray-300 text-xs">{content.release_year}</span>
                            </div>
                            <p className="text-gray-300 text-xs mt-2 line-clamp-2">
                              {content.description}
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(content)}
                                className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(content.id)}
                                className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No content found. Add some content to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <EditContentDialog
        content={editingContent}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingContent(null);
        }}
        onSave={handleEditSave}
      />
    </div>
  );
};

export default AdminManage;
