
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash2, ExternalLink, Edit3, Save, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { contentService, ContentItem } from '@/services/contentService';
import { adminService } from '@/services/adminService';

const AdminManage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStreamingLink, setEditStreamingLink] = useState('');

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
    // For now, we'll just show a message since we need to implement link removal in the service
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
            <CardTitle className="text-white text-lg">Movies ({movies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {movies.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No movies added yet.</p>
            ) : (
              <div className="space-y-3">
                {movies.map((movie) => {
                  const streamingLink = movie.streaming_links?.[0]?.url || '';
                  return (
                    <div key={movie.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{movie.title}</h4>
                          <p className="text-gray-400 text-sm">{movie.release_year}</p>
                          
                          {/* Streaming Link Section */}
                          <div className="mt-2">
                            {editingId === movie.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editStreamingLink}
                                  onChange={(e) => setEditStreamingLink(e.target.value)}
                                  className="bg-gray-600 border-gray-500 text-white text-xs"
                                  placeholder="Enter streaming link"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveStreamingLink(movie.id)}
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
                                    onClick={() => handleEditStreamingLink(movie.id, streamingLink)}
                                    className="bg-blue-600 hover:bg-blue-700 px-2 ml-2"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddStreamingLink(movie.id)}
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
                          {streamingLink && (
                            <Button
                              size="sm"
                              onClick={() => handleRemoveStreamingLink(movie.id, movie.title)}
                              className="bg-orange-600 hover:bg-orange-700 text-xs"
                              title="Remove streaming link only"
                            >
                              Remove Link
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleRemoveContent(movie.id, movie.title)}
                            className="bg-red-600 hover:bg-red-700"
                            title="Remove entire movie"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Series Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Series ({series.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {series.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No series added yet.</p>
            ) : (
              <div className="space-y-3">
                {series.map((item) => {
                  const streamingLink = item.streaming_links?.[0]?.url || '';
                  return (
                    <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{item.title}</h4>
                          <p className="text-gray-400 text-sm">{item.release_year}</p>
                          
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
                            title="Remove entire series"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminManage;
