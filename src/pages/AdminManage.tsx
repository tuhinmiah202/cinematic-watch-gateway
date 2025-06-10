
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminManage = () => {
  const { toast } = useToast();
  const [managedMovies, setManagedMovies] = useState([
    {
      id: 1,
      title: "Sample Movie 1",
      year: 2024,
      streamingLink: "https://example.com/movie1",
      type: "movie"
    },
    {
      id: 2,
      title: "Sample Series 1",
      year: 2023,
      streamingLink: "https://example.com/series1",
      type: "series"
    }
  ]);

  const handleRemoveContent = (id: number, title: string) => {
    setManagedMovies(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Content Removed",
      description: `${title} has been removed from the platform.`,
    });
  };

  const movies = managedMovies.filter(item => item.type === 'movie');
  const series = managedMovies.filter(item => item.type === 'series');

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
                <div className="text-2xl font-bold text-green-400">{managedMovies.length}</div>
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
                        <div className="flex items-center gap-2 mt-2">
                          <ExternalLink className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 text-xs truncate max-w-xs">{movie.streamingLink}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRemoveContent(movie.id, movie.title)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                        <div className="flex items-center gap-2 mt-2">
                          <ExternalLink className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 text-xs truncate max-w-xs">{item.streamingLink}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRemoveContent(item.id, item.title)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
