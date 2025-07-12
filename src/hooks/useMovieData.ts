
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';

// Function to determine if content is from Supabase
const isSupabaseContent = (movie: any) => !!movie.content_type;

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

  // Only fetch from Supabase - user-added content only
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
      setSupabaseMovies(supabaseData);
    }
  }, [supabaseData]);

  // Filter and process only Supabase content
  const allMovies = useCallback(() => {
    let filteredMovies = [...supabaseMovies];

    // Filter by content type
    if (contentType === 'movie') {
      filteredMovies = filteredMovies.filter(movie => movie.content_type === 'movie');
    } else if (contentType === 'tv') {
      filteredMovies = filteredMovies.filter(movie => movie.content_type === 'series');
    } else if (contentType === 'animation') {
      const animationGenreId = 16;
      const genreInfo = genres.find(g => g.id === animationGenreId);
      
      filteredMovies = filteredMovies.filter((movie) => {
        return movie.genres?.some((g: any) => g.id === animationGenreId || (genreInfo && g.name === genreInfo.name));
      });
    }

    // Filter by genre
    if (selectedGenre && selectedGenre !== 'all') {
      const genreId = parseInt(selectedGenre);
      const genreInfo = genres.find(g => g.id === genreId);
      
      filteredMovies = filteredMovies.filter((movie) => {
        return movie.genres?.some((g: any) => g.id === genreId || (genreInfo && g.name === genreInfo.name));
      });
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filteredMovies = filteredMovies.filter((movie) => {
        return movie.title?.toLowerCase().includes(lowerSearchTerm);
      });
    }

    return filteredMovies;
  }, [supabaseMovies, selectedGenre, debouncedSearchTerm, genres, contentType]);

  return {
    genres,
    allMovies: allMovies(),
    isLoading: isLoadingSupabase,
  };
};
