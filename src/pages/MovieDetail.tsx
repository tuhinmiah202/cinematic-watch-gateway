import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbService, Movie } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { reviewService } from '@/services/reviewService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Calendar, Clock, Play, User, Tv } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { useAdClickTrackerSingle } from '@/hooks/useAdClickTrackerSingle';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const movieId = id || '0';
  const { handleClickWithAd, hasClicked } = useAdClickTrackerSingle(movieId);

  const handleBack = () => {
    // Always use browser's natural back behavior to prevent loops
    navigate(-1);
  };

  const handleWatchNow = () => {
    handleClickWithAd(() => navigate(`/download-step1/${movieId}`));
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
          const tvShow = await tmdbService.getTVShowDetails(numericId);
          console.log('TV Show fetched:', tvShow);
          return tvShow;
        } catch (tvError) {
          console.error('Both movie and TV fetch failed:', { movieError, tvError });
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
  // Only show loading for the initial content fetch
  const isLoading = isLoadingSupabase || (isLoadingTmdb && !supabaseContent);

  // Calculate dependencies for related content query before any early returns.
  const currentMovieTmdbId = movie ? ((movie as any).tmdb_id || movie.id) : null;
  
  const genresForQuery = supabaseContent
    ? tmdbDetails?.genres || supabaseContent.genres || []
    : tmdbContent?.genres || [];
    
  const primaryGenreId = genresForQuery?.[0]?.id ?? null;

  const { data: relatedContent, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['related-content', currentMovieTmdbId, primaryGenreId],
    queryFn: async () => {
      if (!primaryGenreId || !currentMovieTmdbId) return [];

      const numericGenreId = Number(primaryGenreId);
      if (isNaN(numericGenreId)) {
        console.error("Invalid genre ID for related content query:", primaryGenreId);
        return [];
      }

      try {
        const [moviesResponse, tvShowsResponse] = await Promise.all([
          tmdbService.getMoviesByGenre(numericGenreId, 1),
          tmdbService.getTVShowsByGenre(numericGenreId, 1)
        ]);
        
        const combined = [...moviesResponse.results, ...tvShowsResponse.results];
        
        // Shuffle, filter out the current movie, and limit results
        return combined
          .sort(() => 0.5 - Math.random()) // Randomize for variety
          .filter(item => item.id != currentMovieTmdbId) // Use != to handle potential type difference
          .slice(0, 8); // Reduced to 8 for better performance
      } catch (error) {
        console.error('Error fetching related content:', error);
        return [];
      }
    },
    enabled: !!primaryGenreId && !!currentMovieTmdbId && !isLoading,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6 animate-pulse">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-48 h-72 md:w-56 md:h-84 bg-gray-700 rounded-lg"></div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
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
    year = supabaseMovie.release_year;
    isTV = supabaseMovie.content_type === 'series';
    cast = tmdbCast || supabaseMovie.cast_members || [];
    genres = genresForQuery;
    
    // Use database description if available, otherwise fall back to custom review
    if (supabaseMovie.description && supabaseMovie.description.trim()) {
      overview = supabaseMovie.description;
      // Use rating from database if available, otherwise use review service rating
      rating = supabaseMovie.rating || tmdbDetails?.vote_average || reviewService.getReview(supabaseMovie.tmdb_id || supabaseMovie.id)?.rating || reviewService.getDefaultReview(title, isTV).rating;
    } else {
      // Fall back to review service
      const customReview = reviewService.getReview(supabaseMovie.tmdb_id || supabaseMovie.id);
      if (customReview) {
        overview = customReview.review;
        rating = customReview.rating;
      } else {
        const defaultReview = reviewService.getDefaultReview(title, isTV);
        overview = defaultReview.review;
        rating = defaultReview.rating;
      }
    }
  } else {
    const tmdbMovie = movie as any;
    title = tmdbMovie.title || tmdbMovie.name || 'Untitled';
    releaseDate = tmdbMovie.release_date || tmdbMovie.first_air_date;
    year = tmdbMovie.year || (releaseDate ? new Date(releaseDate).getFullYear() : 'N/A');
    isTV = tmdbMovie.media_type === 'tv' || tmdbMovie.type === 'series' || tmdbMovie.name || !tmdbMovie.title;
    cast = tmdbCast || [];
    genres = genresForQuery;
    
    // Get custom review
    const customReview = reviewService.getReview(tmdbMovie.id);
    if (customReview) {
      overview = customReview.review;
      rating = customReview.rating;
    } else {
      const defaultReview = reviewService.getDefaultReview(title, isTV);
      overview = defaultReview.review;
      rating = defaultReview.rating;
    }
  }

  const posterUrl = isSupabaseContent 
    ? (movie as any).poster_url || '/placeholder.svg'
    : tmdbService.getImageUrl((movie as any).poster_path);

  // Generate unique SEO keywords and content
  const generateSEOContent = (title: string, genres: any[], year: any, isTV: boolean) => {
    const genreNames = genres.map(g => g.name).slice(0, 3);
    const contentType = isTV ? 'series' : 'movie';
    const yearStr = year ? ` ${year}` : '';
    
    const keywords = [
      `${title} ${contentType}`,
      `watch ${title} online`,
      `${title} streaming`,
      `${title} review`,
      ...genreNames.map(g => `${g} ${contentType}`),
      `${title}${yearStr} cast`,
      `best ${genreNames[0] || 'drama'} ${contentType}`,
      `${title} recommendation`
    ].filter(Boolean);

    const description = `Discover everything about ${title}${yearStr} - a captivating ${genreNames.join(', ')} ${contentType}. Get expert insights, cast details, and find the best streaming platforms. Perfect for fans of ${genreNames[0] || 'quality entertainment'} seeking their next binge-watch adventure.`;

    return { keywords, description };
  };

  const seoContent = generateSEOContent(title, genres, year, isTV);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-black/50 text-white border-white/20 hover:bg-white/10"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Movie Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={posterUrl}
              alt={title}
              className="w-48 h-72 md:w-56 md:h-84 object-cover rounded-lg shadow-xl"
            />
          </div>

          <div className="flex-1 text-white text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">{title}</h1>
              {isTV && <Tv className="w-6 h-6 text-purple-400" />}
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold">{rating.toFixed(1)} TM</span>
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
                  className="px-3 py-1 bg-purple-600 rounded-full text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="text-center md:text-left">
              <p className="text-gray-300 text-sm mb-3">👉 Available on platforms like Netflix, Disney+, etc.</p>
              {!hasClicked && (
                <p className="text-yellow-400 text-sm mb-2 font-semibold animate-pulse">
                  ⚠️ Click Watch Now 1 time to proceed
                </p>
              )}
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-10 py-4 text-xl font-bold shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] transition-all duration-300 transform hover:scale-110 w-full md:w-auto border-2 border-red-400 hover:border-red-300 animate-pulse hover:animate-none"
                onClick={handleWatchNow}
              >
                <Play className="w-6 h-6 mr-2 fill-white" />
                Watch Now
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 blur-xl transition-opacity duration-300"></span>
              </Button>
            </div>

            {/* Review section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Review</h3>
              <p className="text-base text-gray-300 leading-relaxed max-w-3xl">{overview}</p>
            </div>
          </div>
        </div>

        {/* Cast Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
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
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold text-white mb-3">Production</h3>
            <div className="flex flex-wrap gap-2">
              {(movie as any).production_companies.slice(0, 3).map((company: any) => (
                <span key={company.id} className="text-gray-300 text-sm bg-gray-700 px-3 py-1 rounded">
                  {company.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SEO Content Section - Simplified */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20 mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            {seoContent.description}
          </p>
        </div>

        {/* Related Content Section */}
        {relatedContent && relatedContent.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              You Might Also Like
              {isLoadingRelated && <Loader2 className="w-5 h-5 animate-spin" />}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedContent.map((item: Movie) => (
                <MovieCard key={`${item.id}-${item.media_type}`} movie={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetail;
