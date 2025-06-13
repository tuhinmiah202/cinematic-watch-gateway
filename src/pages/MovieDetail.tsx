import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Clock, Play, User, Tv } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const movieId = id || '0';

  const handleBack = () => {
    const backParams = searchParams.get('back');
    if (backParams) {
      navigate(`/?${decodeURIComponent(backParams)}`);
    } else {
      navigate(-1);
    }
  };

  const handleWatchNow = () => {
    navigate(`/watch/${movieId}`);
  };

  // Try to fetch from Supabase first (for admin content)
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-detail', movieId],
    queryFn: async () => {
      if (movieId.includes('-') && movieId.length === 36) {
        return await contentService.getContentById(movieId);
      }
      return null;
    },
    enabled: !!movieId
  });

  // Fetch from TMDB if not found in Supabase
  const { data: tmdbContent, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-content-detail', movieId],
    queryFn: async () => {
      if (supabaseContent) return null;
      
      const numericId = parseInt(movieId);
      if (isNaN(numericId)) return null;
      
      try {
        return await tmdbService.getMovieDetails(numericId);
      } catch (movieError) {
        try {
          return await tmdbService.getTVShowDetails(numericId);
        } catch (tvError) {
          throw new Error('Content not found');
        }
      }
    },
    enabled: !!movieId && !supabaseContent && !isLoadingSupabase
  });

  // Fetch cast data from TMDB for both Supabase and TMDB content
  const { data: tmdbCast, isLoading: isLoadingCast } = useQuery({
    queryKey: ['tmdb-cast', movieId, supabaseContent?.tmdb_id],
    queryFn: async () => {
      let tmdbId = null;
      
      // Get TMDB ID from either source
      if (supabaseContent?.tmdb_id) {
        tmdbId = supabaseContent.tmdb_id;
      } else if (!isNaN(parseInt(movieId))) {
        tmdbId = parseInt(movieId);
      }
      
      if (!tmdbId) return [];
      
      try {
        // Try movie first
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=566149bf98e53cc39a4c04bfe01c03fc`
        );
        if (response.ok) {
          const data = await response.json();
          return data.cast?.slice(0, 8) || [];
        }
        
        // Try TV show if movie fails
        const tvResponse = await fetch(
          `https://api.themoviedb.org/3/tv/${tmdbId}/credits?api_key=566149bf98e53cc39a4c04bfe01c03fc`
        );
        if (tvResponse.ok) {
          const tvData = await tvResponse.json();
          return tvData.cast?.slice(0, 8) || [];
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching cast:', error);
        return [];
      }
    },
    enabled: !!(supabaseContent?.tmdb_id || (!isNaN(parseInt(movieId)) && !supabaseContent))
  });

  // Fetch additional movie details for rating if we have Supabase content
  const { data: tmdbDetails } = useQuery({
    queryKey: ['tmdb-details', supabaseContent?.tmdb_id],
    queryFn: async () => {
      if (!supabaseContent?.tmdb_id) return null;
      
      try {
        const isTV = supabaseContent.content_type === 'series';
        if (isTV) {
          return await tmdbService.getTVShowDetails(supabaseContent.tmdb_id);
        } else {
          return await tmdbService.getMovieDetails(supabaseContent.tmdb_id);
        }
      } catch (error) {
        console.error('Error fetching TMDB details:', error);
        return null;
      }
    },
    enabled: !!(supabaseContent?.tmdb_id)
  });

  const movie = supabaseContent || tmdbContent;
  const isLoading = isLoadingSupabase || isLoadingTmdb;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-xl font-bold mb-4">Content not found</h1>
          <Button onClick={handleBack}>Return Back</Button>
        </div>
      </div>
    );
  }

  // Handle both Supabase and TMDB content formats
  const isSupabaseContent = !!(movie as any).content_type;
  let title, overview, releaseDate, year, rating, isTV, cast, genres;

  if (isSupabaseContent) {
    const supabaseMovie = movie as any;
    title = supabaseMovie.title;
    overview = supabaseMovie.description || 'No description available';
    year = supabaseMovie.release_year;
    // Use TMDB rating if available, otherwise default
    rating = tmdbDetails?.vote_average || 8.5;
    isTV = supabaseMovie.content_type === 'series';
    // Use TMDB cast if available, otherwise fall back to Supabase cast
    cast = tmdbCast || supabaseMovie.cast_members || [];
    genres = tmdbDetails?.genres || supabaseMovie.genres || [];
  } else {
    const tmdbMovie = movie as any;
    title = tmdbMovie.title || tmdbMovie.name || 'Untitled';
    overview = tmdbMovie.overview || 'No description available';
    releaseDate = tmdbMovie.release_date || tmdbMovie.first_air_date;
    year = tmdbMovie.year || (releaseDate ? new Date(releaseDate).getFullYear() : 'N/A');
    rating = tmdbMovie.vote_average || 0;
    isTV = tmdbMovie.media_type === 'tv' || tmdbMovie.type === 'series' || tmdbMovie.name;
    cast = tmdbCast || [];
    genres = tmdbMovie.genres || [];
  }

  const posterUrl = isSupabaseContent 
    ? (movie as any).poster_url || '/placeholder.svg'
    : tmdbService.getImageUrl((movie as any).poster_path);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-black/50 text-white border-white/20"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* AdSense Placeholder */}
        <div className="w-full h-12 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4">
          <p className="text-gray-400 text-xs">AdSense Advertisement</p>
        </div>

        {/* Movie Info */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={posterUrl}
              alt={title}
              className="w-40 h-60 md:w-48 md:h-72 object-cover rounded-lg shadow-xl"
            />
          </div>

          <div className="flex-1 text-white text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">{title}</h1>
              {isTV && <Tv className="w-6 h-6 text-purple-400" />}
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{year}</span>
              </div>
              {(movie as any).runtime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{(movie as any).runtime} min</span>
                </div>
              )}
              {isTV && (movie as any).number_of_seasons && (
                <div className="flex items-center gap-1">
                  <Tv className="w-4 h-4" />
                  <span className="text-sm">{(movie as any).number_of_seasons} Seasons</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
              {genres.map((genre: any, index: number) => (
                <span 
                  key={genre.id || index}
                  className="px-2 py-1 bg-purple-600 rounded-full text-xs"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-4">{overview}</p>

            <div className="text-center md:text-left">
              <p className="text-gray-300 text-sm mb-2">👉 Available on platforms like Netflix, Disney+, etc.</p>
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 w-full md:w-auto"
                onClick={handleWatchNow}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Now
              </Button>
            </div>
          </div>
        </div>

        {/* Cast Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-4">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Cast {isLoadingCast && <Loader2 className="w-4 h-4 animate-spin" />}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cast.slice(0, 8).map((actor: any, index: number) => (
              <div key={actor.id || index} className="text-center">
                <h4 className="text-white text-sm font-semibold line-clamp-1">{actor.name}</h4>
                <p className="text-gray-400 text-xs line-clamp-1">{actor.character || actor.character_name || actor.role || 'Actor'}</p>
              </div>
            ))}
          </div>
          {cast.length === 0 && !isLoadingCast && (
            <p className="text-gray-400 text-center">No cast information available</p>
          )}
        </div>

        {/* Production Details */}
        {(movie as any).production_companies && (movie as any).production_companies.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-white mb-3">Production</h3>
            <div className="flex flex-wrap gap-2">
              {(movie as any).production_companies.slice(0, 3).map((company: any) => (
                <span key={company.id} className="text-gray-300 text-sm bg-gray-700 px-2 py-1 rounded">
                  {company.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AdSense Placeholder */}
        <div className="w-full h-12 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center">
          <p className="text-gray-400 text-xs">AdSense Footer Advertisement</p>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
