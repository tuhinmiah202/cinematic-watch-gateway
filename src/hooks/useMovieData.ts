
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';

export const useMovieData = (selectedGenre: string, debouncedSearchTerm: string, contentType: string, page: number = 1) => {
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

  // Fetch movies/shows directly from TMDB
  const {
    data: tmdbData,
    isLoading,
  } = useQuery({
    queryKey: ['tmdb-content', selectedGenre, debouncedSearchTerm, contentType, page],
    queryFn: async () => {
      if (debouncedSearchTerm) {
        const response = await tmdbService.searchMovies(debouncedSearchTerm, page);
        // Filter by content type if needed after search
        let results = response.results;
        if (contentType === 'movie') {
          results = results.filter(item => item.media_type === 'movie');
        } else if (contentType === 'tv') {
          results = results.filter(item => item.media_type === 'tv');
        }
        return { results, total_pages: response.total_pages };
      }

      if (selectedGenre && selectedGenre !== 'all') {
        const genreId = parseInt(selectedGenre);
        if (contentType === 'tv') {
          return await tmdbService.getTVShowsByGenre(genreId, page);
        } else if (contentType === 'movie') {
          return await tmdbService.getMoviesByGenre(genreId, page);
        } else {
          // Default to movies for genre filter if 'all' is selected but genre is specified
          return await tmdbService.getMoviesByGenre(genreId, page);
        }
      }

      // Default fetch based on content type
      if (contentType === 'movie') {
        return await tmdbService.getPopularMovies(page);
      } else if (contentType === 'tv') {
        return await tmdbService.getPopularTVShows(page);
      } else if (contentType === 'hindi') {
        // Fetch movies with Hindi original language or specific keywords
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=566149bf98e53cc39a4c04bfe01c03fc&with_original_language=hi&page=${page}&sort_by=popularity.desc`
        );
        const data = await response.json();
        return {
          results: data.results.map((item: any) => ({ ...item, media_type: 'movie' })),
          total_pages: data.total_pages
        };
      } else {
        // For 'all', we might want to combine or just show popular movies
        return await tmdbService.getPopularMovies(page);
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    genres,
    allMovies: tmdbData?.results || [],
    totalPages: tmdbData?.total_pages || 1,
    isLoading,
  };
};
