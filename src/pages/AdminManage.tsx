
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash2, ExternalLink, Edit3, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManagedContent {
  id: number;
  title: string;
  year: number;
  streamingLink: string;
  type: 'movie' | 'series';
  tmdbId?: number;
}

const AdminManage = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [managedContent, setManagedContent] = useState<ManagedContent[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStreamingLink, setEditStreamingLink] = useState('');

  useEffect(() => {
    // Get content from location state or localStorage
    if (location.state?.managedContent) {
      setManagedContent(location.state.managedContent);
    } else {
      const saved = localStorage.getItem('adminManagedContent');
      if (saved) {
        setManagedContent(JSON.parse(saved));
      }
    }
  }, [location.state]);

  useEffect(() => {
    // Save to localStorage whenever content changes
    localStorage.setItem('adminManagedContent', JSON.stringify(managedContent));
  }, [managedContent]);

  const handleRemoveContent = (id: number, title: string) => {
    setManagedContent(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Content Removed",
      description: `${title} has been removed from the platform.`,
    });
  };

  const handleRemoveStreamingLink = (id: number, title: string) => {
    setManagedContent(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, streamingLink: '' }
          : item
      )
    );
    toast({
      title: "Streaming Link Removed",
      description: `Streaming link for ${title} has been removed.`,
    });
  };

  const handleEditStreamingLink = (id: number, currentLink: string) => {
    setEditingId(id);
    setEditStreamingLink(currentLink);
  };

  const handleSaveStreamingLink = (id: number) => {
    if (!editStreamingLink.trim()) {
      toast({
        title: "Invalid Link",
        description: "Please enter a valid streaming link.",
        variant: "destructive",
      });
      return;
    }

    setManagedContent(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, streamingLink: editStreamingLink.trim() }
          : item
      )
    );

    toast({
      title: "Streaming Link Updated",
      description: "The streaming link has been updated successfully.",
    });

    setEditingId(null);
    setEditStreamingLink('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStreamingLink('');
  };

  const movies = managedContent.filter(item => item.type === 'movie');
  const series = managedContent.filter(item => item.type === 'series');

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
                {movies.map((movie) => (
                  <div key={movie.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{movie.title}</h4>
                        <p className="text-gray-400 text-sm">{movie.year}</p>
                        
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
                                {movie.streamingLink || 'No streaming link'}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleEditStreamingLink(movie.id, movie.streamingLink)}
                                className="bg-blue-600 hover:bg-blue-700 px-2 ml-2"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {movie.streamingLink && (
                          <Button
                            size="sm"
                            onClick={() => handleRemoveStreamingLink(movie.id, movie.title)}
                            className="bg-orange-600 hover:bg-orange-700"
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
                ))}
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
                {series.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{item.title}</h4>
                        <p className="text-gray-400 text-sm">{item.year}</p>
                        
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
                                {item.streamingLink || 'No streaming link'}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleEditStreamingLink(item.id, item.streamingLink)}
                                className="bg-blue-600 hover:bg-blue-700 px-2 ml-2"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {item.streamingLink && (
                          <Button
                            size="sm"
                            onClick={() => handleRemoveStreamingLink(item.id, item.title)}
                            className="bg-orange-600 hover:bg-orange-700"
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminManage;
