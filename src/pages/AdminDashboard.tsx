import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { adminService } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LogOut, Film, Plus, Search, Home, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SitemapManager from "@/components/admin/SitemapManager";
import { Sitemap } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk genre search states
  const [selectedGenre, setSelectedGenre] = useState('');
  const [contentType, setContentType] = useState<'movie' | 'tv'>('movie');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  
  // Manual form states
  const [manualTitle, setManualTitle] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPoster, setManualPoster] = useState('');
  const [manualType, setManualType] = useState<'movie' | 'series'>('movie');
  const [manualCast, setManualCast] = useState('');
  const [manualStreamingUrl, setManualStreamingUrl] = useState('');

  const [currentTab, setCurrentTab] = useState<"dashboard" | "sitemap">("dashboard");

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin');
    }
  }, [navigate]);

  // Fetch admin content from Supabase
  const { data: adminContent = [], refetch: refetchContent } = useQuery({
    queryKey: ['admin-content'],
    queryFn: adminService.getAllContent
  });

  // Fetch genres
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: tmdbService.getGenres
  });

  // Search TMDB
  const { data: searchResults, refetch: searchMovies } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => tmdbService.searchMovies(searchQuery),
    enabled: false
  });

  // Search by genre
  const { data: genreResults, refetch: searchByGenre, isLoading: isLoadingGenre } = useQuery({
    queryKey: ['genre-search', selectedGenre, contentType],
    queryFn: () => {
      const genreId = parseInt(selectedGenre);
      return contentType === 'movie' 
        ? tmdbService.getMoviesByGenre(genreId, 1)
        : tmdbService.getTVShowsByGenre(genreId, 1);
    },
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

  const handleGenreSearch = () => {
    if (selectedGenre) {
      setSelectedItems(new Set());
      searchByGenre();
    }
  };

  const handleItemSelect = (itemId: number, isSelected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (isSelected) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkAdd = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to add.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingBulk(true);
    const items = genreResults?.results.filter(item => selectedItems.has(item.id)) || [];
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      const success = await adminService.addFromTMDB(item);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    toast({
      title: "Bulk Add Complete",
      description: `Added ${successCount} items successfully. ${errorCount} failed or already exist.`,
    });

    if (successCount > 0) {
      refetchContent();
      queryClient.invalidateQueries({ queryKey: ['supabase-content'] });
    }

    setSelectedItems(new Set());
    setIsAddingBulk(false);
  };

  const handleAddTMDBMovie = async (movie: any) => {
    const success = await adminService.addFromTMDB(movie);
    
    if (success) {
      const title = movie.title || movie.name;
      const type = movie.media_type === 'tv' ? 'series' : 'movie';
      
      toast({
        title: `${type === 'movie' ? 'Movie' : 'Series'} Added`,
        description: `${title} has been added successfully.`,
      });
      
      refetchContent();
      queryClient.invalidateQueries({ queryKey: ['supabase-content'] });
    } else {
      toast({
        title: "Error",
        description: "Failed to add content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddManualContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title.",
        variant: "destructive",
      });
      return;
    }

    const castNames = manualCast.split(',').map(name => name.trim()).filter(Boolean);

    const success = await adminService.addCustomContent({
      title: manualTitle.trim(),
      description: manualDescription.trim(),
      content_type: manualType,
      release_year: parseInt(manualYear) || new Date().getFullYear(),
      poster_url: manualPoster.trim(),
      cast_names: castNames,
      streaming_url: manualStreamingUrl.trim()
    });

    if (success) {
      toast({
        title: `${manualType === 'movie' ? 'Movie' : 'Series'} Added`,
        description: `${manualTitle} has been added successfully.`,
      });

      // Reset form
      setManualTitle('');
      setManualYear('');
      setManualDescription('');
      setManualPoster('');
      setManualCast('');
      setManualStreamingUrl('');
      
      refetchContent();
      queryClient.invalidateQueries({ queryKey: ['supabase-content'] });
    } else {
      toast({
        title: "Error",
        description: "Failed to add content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const movies = adminContent.filter(item => item.content_type === 'movie');
  const series = adminContent.filter(item => item.content_type === 'series');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-white border-white/20" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-1" />
                Home
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 mt-4">
        <div className="flex gap-2 mb-4">
          <Button
            className={`flex-1 md:flex-none ${
              currentTab === "dashboard" ? "bg-purple-600 text-white font-semibold" : "bg-gray-700 text-gray-300"
            }`}
            onClick={() => setCurrentTab("dashboard")}
          >
            Dashboard
          </Button>
          <Button
            className={`flex-1 md:flex-none ${
              currentTab === "sitemap" ? "bg-yellow-400 text-black font-semibold" : "bg-gray-700 text-gray-300"
            } flex items-center gap-2`}
            onClick={() => setCurrentTab("sitemap")}
            data-testid="sitemap-tab"
          >
            <Sitemap className="w-4 h-4" />
            Sitemap
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {currentTab === "dashboard" && (
          <>
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
                  <div className="text-2xl font-bold text-green-400">{adminContent.length}</div>
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
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-sm"
                    onClick={() => navigate('/admin/manage')}
                  >
                    Manage Content
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Bulk Genre Search and Add */}
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white text-lg">Bulk Add by Genre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white text-sm">Content Type</Label>
                    <Select value={contentType} onValueChange={(value: 'movie' | 'tv') => setContentType(value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="movie" className="text-white">Movies</SelectItem>
                        <SelectItem value="tv" className="text-white">TV Series</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white text-sm">Genre</Label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {genresData && genresData.genres && genresData.genres.map((genre) => (
                          <SelectItem key={genre.id} value={genre.id.toString()} className="text-white">
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleGenreSearch} 
                      disabled={!selectedGenre || isLoadingGenre}
                      className="bg-purple-600 hover:bg-purple-700 w-full"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {isLoadingGenre ? 'Loading...' : 'Search'}
                    </Button>
                  </div>
                </div>

                {/* Genre Search Results */}
                {genreResults && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">
                        Results ({genreResults.results?.length || 0})
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedItems(new Set(genreResults.results?.map(item => item.id) || []))}
                          variant="outline"
                          size="sm"
                          className="text-white border-white/20"
                        >
                          Select All
                        </Button>
                        <Button
                          onClick={() => setSelectedItems(new Set())}
                          variant="outline"
                          size="sm"
                          className="text-white border-white/20"
                        >
                          Clear All
                        </Button>
                        <Button
                          onClick={handleBulkAdd}
                          disabled={selectedItems.size === 0 || isAddingBulk}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isAddingBulk ? 'Adding...' : `Add Selected (${selectedItems.size})`}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                      {genreResults.results && genreResults.results.slice(0, 20).map((item) => {
                        const title = item.title || item.name;
                        const releaseDate = item.release_date || item.first_air_date;
                        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                        const type = item.media_type === 'tv' ? 'TV Series' : 'Movie';
                        const isSelected = selectedItems.has(item.id);
                        
                        return (
                          <div key={item.id} className="bg-gray-700 rounded-lg p-3">
                            <div className="flex gap-3 items-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                                className="border-white"
                              />
                              <img
                                src={tmdbService.getImageUrl(item.poster_path)}
                                alt={title}
                                className="w-12 h-16 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-sm truncate">{title}</h4>
                                <p className="text-gray-400 text-xs">{year}</p>
                                <p className="text-gray-500 text-xs">{type}</p>
                                <p className="text-gray-500 text-xs truncate">{item.overview}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TMDB Search and Add */}
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white text-lg">Search and Add Movies/Series from TMDB</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search movies and series by title..."
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

                {/* Search Results */}
                {searchResults && (
                  <div className="mt-4">
                    <h3 className="text-white font-semibold mb-3 text-sm">Search Results:</h3>
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                      {searchResults.results && searchResults.results.slice(0, 6).map((movie) => {
                        const title = movie.title || movie.name;
                        const releaseDate = movie.release_date || movie.first_air_date;
                        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                        const type = movie.media_type === 'tv' ? 'TV Series' : 'Movie';
                        
                        return (
                          <div key={movie.id} className="bg-gray-700 rounded-lg p-3">
                            <div className="flex gap-3 items-center">
                              <img
                                src={tmdbService.getImageUrl(movie.poster_path)}
                                alt={title}
                                className="w-12 h-16 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-sm truncate">{title}</h4>
                                <p className="text-gray-400 text-xs">{year}</p>
                                <p className="text-gray-500 text-xs">{type}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddTMDBMovie(movie)}
                                className="bg-green-600 hover:bg-green-700 text-xs px-3"
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        );
                      })}
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
                    <Label className="text-white text-sm">Cast (comma-separated)</Label>
                    <Input 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="Actor 1, Actor 2, Actor 3..."
                      value={manualCast}
                      onChange={(e) => setManualCast(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white text-sm">Streaming URL</Label>
                    <Input 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="https://..."
                      value={manualStreamingUrl}
                      onChange={(e) => setManualStreamingUrl(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    Add {manualType === 'movie' ? 'Movie' : 'Series'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
        {currentTab === "sitemap" && (
          <SitemapManager />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
