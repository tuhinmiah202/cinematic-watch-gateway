
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
          // If no genre data exists, fetch from TMDB by title match
          const title = movie.title?.toLowerCase() || '';
          const isAnimationByTitle = title.includes('anime') || 
            title.includes('cartoon') || 
            title.includes('animation') ||
            title.includes('animated');
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

    // Filter by genre - handle missing genre data gracefully
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
          // Regular genre filtering
          filteredMovies = filteredMovies.filter((movie) => {
            // If movie has no genre data, include it if it matches by TMDB ID
            if (!movie.genres || !Array.isArray(movie.genres) || movie.genres.length === 0) {
              // For movies without genre data, we'll use TMDB to get genre info
              if (movie.tmdb_id) {
                // This is a fallback - in a real app you'd want to fetch TMDB data
                return true; // Include for now
              }
              return false;
            }
            
            // Filter by matching genre
            return movie.genres.some((movieGenre: any) => {
              const matchById = movieGenre.id && parseInt(movieGenre.id) === genreId;
              const matchByTmdbId = movieGenre.tmdb_id && movieGenre.tmdb_id === genreId;
              const matchByName = genreInfo && movieGenre.name && 
                movieGenre.name.toLowerCase() === genreInfo.name.toLowerCase();
              
              return matchById || matchByTmdbId || matchByName;
            });
          });
        }
        
        console.log('After genre filter:', filteredMovies.length, 'movies remain');
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
