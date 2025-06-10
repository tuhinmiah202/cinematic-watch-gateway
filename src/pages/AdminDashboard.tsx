
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Film, Plus, Search, Home, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManagedContent {
  id: number;
  title: string;
  year: number;
  streamingLink: string;
  type: 'movie' | 'series';
  tmdbId?: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [streamingLink, setStreamingLink] = useState('');
  const [managedContent, setManagedContent] = useState<ManagedContent[]>([]);
  
  // Manual form states
  const [manualTitle, setManualTitle] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPoster, setManualPoster] = useState('');
  const [manualStreamingLink, setManualStreamingLink] = useState('');
  const [manualType, setManualType] = useState<'movie' | 'series'>('movie');

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

  const handleAddTMDBMovie = (movie: any) => {
    if (!streamingLink.trim()) {
      toast({
        title: "Streaming Link Required",
        description: "Please enter a streaming link before adding the movie.",
        variant: "destructive",
      });
      return;
    }

    const newContent: ManagedContent = {
      id: Date.now(),
      title: movie.title,
      year: new Date(movie.release_date).getFullYear(),
      streamingLink: streamingLink.trim(),
      type: 'movie',
      tmdbId: movie.id
    };

    setManagedContent(prev => [...prev, newContent]);
    
    toast({
      title: "Movie Added",
      description: `${movie.title} has been added with streaming link.`,
    });
    setStreamingLink('');
  };

  const handleAddManualContent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualTitle.trim() || !manualStreamingLink.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in title and streaming link.",
        variant: "destructive",
      });
      return;
    }

    const newContent: ManagedContent = {
      id: Date.now(),
      title: manualTitle.trim(),
      year: parseInt(manualYear) || new Date().getFullYear(),
      streamingLink: manualStreamingLink.trim(),
      type: manualType
    };

    setManagedContent(prev => [...prev, newContent]);
    
    toast({
      title: `${manualType === 'movie' ? 'Movie' : 'Series'} Added`,
      description: `${manualTitle} has been added successfully.`,
    });

    // Reset form
    setManualTitle('');
    setManualYear('');
    setManualDescription('');
    setManualPoster('');
    setManualStreamingLink('');
  };

  const movies = managedContent.filter(item => item.type === 'movie');
  const series = managedContent.filter(item => item.type === 'series');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm" className="text-white border-white/20">
                  <Home className="w-4 h-4 mr-1" />
                  Home
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Film className="w-4 h-4 text-purple-400" />
                Movies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{movies.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Film className="w-4 h-4 text-blue-400" />
                Series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{series.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4 text-green-400" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{managedContent.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4 text-orange-400" />
                Manage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/admin/manage" state={{ managedContent, setManagedContent }}>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-sm">
                  Manage Content
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* TMDB Search and Add */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">Search and Add Movies from TMDB</CardTitle>
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
              <Label className="text-white text-sm">Streaming Link (Required)</Label>
              <Input
                placeholder="https://streaming-platform.com/movie-link"
                value={streamingLink}
                onChange={(e) => setStreamingLink(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Search Results */}
            {searchResults && (
              <div className="mt-4">
                <h3 className="text-white font-semibold mb-3 text-sm">Search Results:</h3>
                <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                  {searchResults.results.slice(0, 6).map((movie) => (
                    <div key={movie.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex gap-3 items-center">
                        <img
                          src={tmdbService.getImageUrl(movie.poster_path)}
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm truncate">{movie.title}</h4>
                          <p className="text-gray-400 text-xs">
                            {new Date(movie.release_date).getFullYear()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddTMDBMovie(movie)}
                          className="bg-green-600 hover:bg-green-700 text-xs px-3"
                          disabled={!streamingLink.trim()}
                        >
                          Add with Link
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Content Addition */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Add Custom Movie/Series</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddManualContent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white text-sm">Title *</Label>
                  <Input 
                    className="bg-gray-700 border-gray-600 text-white" 
                    placeholder="Movie/Series title"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="text-white text-sm">Release Year</Label>
                  <Input 
                    className="bg-gray-700 border-gray-600 text-white" 
                    placeholder="2024" 
                    type="number"
                    value={manualYear}
                    onChange={(e) => setManualYear(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-white text-sm">Type</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      value="movie"
                      checked={manualType === 'movie'}
                      onChange={(e) => setManualType(e.target.value as 'movie' | 'series')}
                      className="text-purple-400"
                    />
                    Movie
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      value="series"
                      checked={manualType === 'series'}
                      onChange={(e) => setManualType(e.target.value as 'movie' | 'series')}
                      className="text-purple-400"
                    />
                    Series
                  </label>
                </div>
              </div>
              
              <div>
                <Label className="text-white text-sm">Description</Label>
                <Textarea 
                  className="bg-gray-700 border-gray-600 text-white" 
                  placeholder="Content description..."
                  rows={3}
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white text-sm">Poster URL</Label>
                  <Input 
                    className="bg-gray-700 border-gray-600 text-white" 
                    placeholder="https://..."
                    value={manualPoster}
                    onChange={(e) => setManualPoster(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-white text-sm">Streaming Link *</Label>
                  <Input 
                    className="bg-gray-700 border-gray-600 text-white" 
                    placeholder="https://..."
                    value={manualStreamingLink}
                    onChange={(e) => setManualStreamingLink(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Add {manualType === 'movie' ? 'Movie' : 'Series'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
