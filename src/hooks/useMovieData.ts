
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
      setSupabaseMovies(supabaseData);
    }
  }, [supabaseData]);

  // Filter and process only Supabase content
  const allMovies = useCallback(() => {
    let filteredMovies = [...supabaseMovies];
    console.log('Starting with', filteredMovies.length, 'movies');

    // Filter by content type
    if (contentType === 'movie') {
      filteredMovies = filteredMovies.filter(movie => movie.content_type === 'movie');
    } else if (contentType === 'tv') {
      filteredMovies = filteredMovies.filter(movie => movie.content_type === 'series');
    } else if (contentType === 'animation') {
      const animationGenreId = 16;
      filteredMovies = filteredMovies.filter((movie) => {
        return movie.genres?.some((g: any) => g.id === animationGenreId || g.name?.toLowerCase().includes('animation'));
      });
    }

    // Filter by genre - simplified and more robust logic
    if (selectedGenre && selectedGenre !== 'all' && selectedGenre !== '') {
      const genreId = parseInt(selectedGenre);
      console.log('Filtering by genre ID:', genreId);
      
      if (!isNaN(genreId)) {
        const genreInfo = genres.find(g => g.id === genreId);
        console.log('Genre info found:', genreInfo);
        
        filteredMovies = filteredMovies.filter((movie) => {
          if (!movie.genres || !Array.isArray(movie.genres)) {
            console.log('Movie has no genres:', movie.title);
            return false;
          }
          
          const hasGenre = movie.genres.some((g: any) => {
            // Check multiple ways genres might be stored
            const matchesTmdbId = g.tmdb_id === genreId;
            const matchesId = g.id === genreId;
            const matchesName = genreInfo && g.name && g.name.toLowerCase() === genreInfo.name.toLowerCase();
            
            console.log('Checking genre:', {
              movieGenre: g,
              targetGenreId: genreId,
              targetGenreName: genreInfo?.name,
              matchesTmdbId,
              matchesId,
              matchesName
            });
            
            return matchesTmdbId || matchesId || matchesName;
          });
          
          console.log('Movie:', movie.title, 'has matching genre:', hasGenre, 'genres:', movie.genres);
          return hasGenre;
        });
        
        console.log('After genre filter:', filteredMovies.length, 'movies');
      }
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filteredMovies = filteredMovies.filter((movie) => {
        return movie.title?.toLowerCase().includes(lowerSearchTerm);
      });
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
