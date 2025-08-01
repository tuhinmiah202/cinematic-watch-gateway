
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';

export const useMovieData = (selectedGenre: string, debouncedSearchTerm: string, contentType: string) => {
  const [supabaseMovies, setSupabaseMovies] = useState<any[]>([]);

  // Fetch genres from TMDB
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      try {
        const response = await tmdbService.getGenres();
        return response?.genres || [];
      } catch (error) {
        console.error('Error fetching genres:', error);
        return [];
      }
    },
  });

  const genres = Array.isArray(genresData) ? genresData : [];

  // Fetch from Supabase - user-added content only
  const {
    data: supabaseData,
    isLoading: isLoadingSupabase,
  } = useQuery({
    queryKey: ['supabase-content', selectedGenre, debouncedSearchTerm, contentType],
    queryFn: () => contentService.getApprovedContent(),
  });

  // Update supabaseMovies when data is fetched
  useEffect(() => {
    if (supabaseData) {
      console.log('Supabase data fetched:', supabaseData.length, 'items');
      console.log('Sample movie with genres:', supabaseData[0]);
      setSupabaseMovies(supabaseData);
    }
  }, [supabaseData]);

  // Filter and process only Supabase content
  const allMovies = useCallback(() => {
    let filteredMovies = [...supabaseMovies];
    console.log('Starting with', filteredMovies.length, 'movies');

    // Filter by content type first
    if (contentType === 'movie') {
      filteredMovies = filteredMovies.filter(movie => movie.content_type === 'movie');
      console.log('After movie filter:', filteredMovies.length, 'movies');
    } else if (contentType === 'tv') {
      filteredMovies = filteredMovies.filter(movie => movie.content_type === 'series');
      console.log('After TV filter:', filteredMovies.length, 'movies');
    } else if (contentType === 'animation') {
      const animationGenreId = 16;
      filteredMovies = filteredMovies.filter((movie) => {
        // Check if movie has genres and has animation genre
        if (!movie.genres || !Array.isArray(movie.genres) || movie.genres.length === 0) {
          // If no genre data exists, check title/description for animation keywords
          const title = movie.title?.toLowerCase() || '';
          const description = movie.description?.toLowerCase() || '';
          const isAnimationByTitle = title.includes('anime') || 
            title.includes('cartoon') || 
            title.includes('animation') ||
            title.includes('animated') ||
            description.includes('anime') ||
            description.includes('cartoon') ||
            description.includes('animation') ||
            description.includes('animated');
          return isAnimationByTitle;
        }
        
        // Check if any genre matches animation
        return movie.genres.some((g: any) => 
          g.id === animationGenreId || 
          g.tmdb_id === animationGenreId || 
          g.name?.toLowerCase().includes('animation')
        );
      });
      console.log('After animation filter:', filteredMovies.length, 'movies');
    }

    // Filter by genre - this is where we fix the main issue
    if (selectedGenre && selectedGenre !== 'all' && selectedGenre !== '') {
      const genreId = parseInt(selectedGenre);
      console.log('Filtering by genre ID:', genreId);
      
      if (!isNaN(genreId)) {
        const genreInfo = genres.find(g => g.id === genreId);
        console.log('Genre info found:', genreInfo);
        
        // Special handling for custom genres
        if (genreId === 999) { // Bollywood
          filteredMovies = filteredMovies.filter(movie => {
            const title = movie.title?.toLowerCase() || '';
            const description = movie.description?.toLowerCase() || '';
            return title.includes('bollywood') || 
                   description.includes('bollywood') ||
                   description.includes('hindi') ||
                   title.includes('hindi');
          });
        } else if (genreId === 998) { // K-Drama
          filteredMovies = filteredMovies.filter(movie => {
            const title = movie.title?.toLowerCase() || '';
            const description = movie.description?.toLowerCase() || '';
            return title.includes('korean') || 
                   description.includes('korean') ||
                   description.includes('korea') ||
                   title.includes('k-drama');
          });
        } else {
          // For regular TMDB genres, since most movies don't have genre data,
          // let's use TMDB API to get genre info for the movies
          const beforeFilterCount = filteredMovies.length;
          filteredMovies = filteredMovies.filter((movie) => {
            // If movie has genre data, use it
            if (movie.genres && Array.isArray(movie.genres) && movie.genres.length > 0) {
              return movie.genres.some((movieGenre: any) => {
                const matchById = movieGenre.id && parseInt(movieGenre.id) === genreId;
                const matchByTmdbId = movieGenre.tmdb_id && movieGenre.tmdb_id === genreId;
                const matchByName = genreInfo && movieGenre.name && 
                  movieGenre.name.toLowerCase() === genreInfo.name.toLowerCase();
                
                return matchById || matchByTmdbId || matchByName;
              });
            }
            
            // If no genre data but we have TMDB ID, we could fetch it
            // For now, let's do keyword matching based on genre names
            if (genreInfo) {
              const title = movie.title?.toLowerCase() || '';
              const description = movie.description?.toLowerCase() || '';
              const genreName = genreInfo.name.toLowerCase();
              
              // Simple keyword matching for some common genres
              switch (genreName) {
                case 'action':
                  return title.includes('action') || description.includes('action') || 
                         description.includes('fight') || description.includes('battle');
                case 'comedy':
                  return title.includes('comedy') || description.includes('comedy') || 
                         description.includes('funny') || description.includes('humor');
                case 'horror':
                  return title.includes('horror') || description.includes('horror') || 
                         description.includes('scary') || description.includes('ghost');
                case 'romance':
                  return title.includes('romance') || description.includes('romance') || 
                         description.includes('love') || title.includes('love');
                case 'drama':
                  return title.includes('drama') || description.includes('drama');
                case 'thriller':
                  return title.includes('thriller') || description.includes('thriller') || 
                         description.includes('suspense');
                case 'crime':
                  return title.includes('crime') || description.includes('crime') || 
                         description.includes('police') || description.includes('detective');
                case 'adventure':
                  return title.includes('adventure') || description.includes('adventure') || 
                         description.includes('journey');
                case 'fantasy':
                  return title.includes('fantasy') || description.includes('fantasy') || 
                         description.includes('magic') || description.includes('magical');
                case 'science fiction':
                  return title.includes('sci-fi') || description.includes('sci-fi') || 
                         description.includes('science fiction') || description.includes('space') ||
                         description.includes('future');
                case 'documentary':
                  return title.includes('documentary') || description.includes('documentary') ||
                         movie.content_type === 'documentary';
                case 'animation':
                  return title.includes('animation') || description.includes('animation') ||
                         title.includes('animated') || description.includes('animated');
                case 'family':
                  return title.includes('family') || description.includes('family') ||
                         description.includes('children') || description.includes('kids');
                case 'music':
                  return title.includes('music') || description.includes('music') ||
                         description.includes('musical') || description.includes('singer');
                case 'mystery':
                  return title.includes('mystery') || description.includes('mystery') ||
                         description.includes('detective') || description.includes('investigation');
                case 'war':
                  return title.includes('war') || description.includes('war') ||
                         description.includes('battle') || description.includes('military');
                case 'western':
                  return title.includes('western') || description.includes('western') ||
                         description.includes('cowboy') || description.includes('wild west');
                case 'history':
                  return title.includes('history') || description.includes('history') ||
                         description.includes('historical') || description.includes('period');
                default:
                  // For other genres, return false so they're filtered out
                  return false;
              }
            }
            
            return false;
          });
          
          console.log(`After ${genreInfo?.name || 'unknown'} genre filter: ${filteredMovies.length} movies (was ${beforeFilterCount})`);
        }
      }
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      const beforeSearchCount = filteredMovies.length;
      filteredMovies = filteredMovies.filter((movie) => {
        return movie.title?.toLowerCase().includes(lowerSearchTerm);
      });
      console.log('After search filter:', filteredMovies.length, 'movies (was', beforeSearchCount, ')');
    }

    console.log('Final filtered movies:', filteredMovies.length);
    
    return filteredMovies;
  }, [supabaseMovies, selectedGenre, debouncedSearchTerm, genres, contentType]);

  return {
    genres,
    allMovies: allMovies(),
    isLoading: isLoadingSupabase,
  };
};
