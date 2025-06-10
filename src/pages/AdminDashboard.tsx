
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Film, Plus, Search, Home, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [streamingLink, setStreamingLink] = useState('');
  const [movieStats] = useState({ movies: 245, series: 89 });
  const [selectedMovies, setSelectedMovies] = useState<any[]>([]);
  const [showManagement, setShowManagement] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin');
    }
  }, [navigate]);

  const { data: searchResults, refetch: searchMovies } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => tmdbService.searchMovies(searchQuery),
    enabled: false
  });

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate('/admin');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMovies();
    }
  };

  const handleAddMovie = (movie: any) => {
    if (!streamingLink.trim()) {
      toast({
        title: "Streaming Link Required",
        description: "Please enter a streaming link before adding the movie.",
        variant: "destructive",
      });
      return;
    }

    const movieWithLink = { ...movie, streamingLink };
    setSelectedMovies(prev => [...prev, movieWithLink]);
    toast({
      title: "Movie Added",
      description: `${movie.title} has been added with streaming link.`,
    });
    setStreamingLink('');
  };

  const handleRemoveMovie = (movieId: number) => {
    setSelectedMovies(prev => prev.filter(m => m.id !== movieId));
    toast({
      title: "Movie Removed",
      description: "Movie has been removed from the platform.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm" className="text-white border-white/20">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" />
                Total Movies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{movieStats.movies}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-400" />
                Total Series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{movieStats.series}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-400" />
                Total Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{movieStats.movies + movieStats.series}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-orange-400" />
                Manage Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowManagement(!showManagement)}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {showManagement ? 'Hide' : 'Show'} Management
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Movie Management Section */}
        {showManagement && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Manage Movies & Series</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMovies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedMovies.map((movie) => (
                    <div key={movie.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex gap-3">
                        <img
                          src={tmdbService.getImageUrl(movie.poster_path)}
                          alt={movie.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">{movie.title}</h4>
                          <p className="text-gray-400 text-xs mb-2">
                            {new Date(movie.release_date).getFullYear()}
                          </p>
                          <p className="text-green-400 text-xs mb-2">
                            Streaming: {movie.streamingLink}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleRemoveMovie(movie.id)}
                            className="bg-red-600 hover:bg-red-700 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No movies added yet. Use the search below to add movies.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Movie Search and Add */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Search and Add Movies from TMDB</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search movies by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div>
              <Label className="text-white">Streaming Link (Required)</Label>
              <Input
                placeholder="https://streaming-platform.com/movie-link"
                value={streamingLink}
                onChange={(e) => setStreamingLink(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Search Results */}
            {searchResults && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-4">Search Results:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {searchResults.results.slice(0, 9).map((movie) => (
                    <div key={movie.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex gap-3">
                        <img
                          src={tmdbService.getImageUrl(movie.poster_path)}
                          alt={movie.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">{movie.title}</h4>
                          <p className="text-gray-400 text-xs mb-2">
                            {new Date(movie.release_date).getFullYear()}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleAddMovie(movie)}
                            className="bg-green-600 hover:bg-green-700 text-xs"
                            disabled={!streamingLink.trim()}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add with Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Movie Addition */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Add Custom Movie/Series</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Title</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white" placeholder="Movie title" />
                </div>
                <div>
                  <Label className="text-white">Release Year</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white" placeholder="2024" type="number" />
                </div>
              </div>
              
              <div>
                <Label className="text-white">Description</Label>
                <Textarea className="bg-gray-700 border-gray-600 text-white" placeholder="Movie description..." />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Poster URL</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white" placeholder="https://..." />
                </div>
                <div>
                  <Label className="text-white">Streaming Link</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white" placeholder="https://..." />
                </div>
              </div>
              
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Add Movie/Series
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
