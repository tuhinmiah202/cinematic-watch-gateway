
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
        return movie.genres?.some((g: any) => 
          g.id === animationGenreId || 
          g.tmdb_id === animationGenreId || 
          g.name?.toLowerCase().includes('animation')
        );
      });
      console.log('After animation filter:', filteredMovies.length, 'movies');
    }

    // Filter by genre - completely rewritten logic
    if (selectedGenre && selectedGenre !== 'all' && selectedGenre !== '') {
      const genreId = parseInt(selectedGenre);
      console.log('Filtering by genre ID:', genreId);
      
      if (!isNaN(genreId)) {
        const genreInfo = genres.find(g => g.id === genreId);
        console.log('Genre info found:', genreInfo);
        
        filteredMovies = filteredMovies.filter((movie) => {
          console.log('Checking movie:', movie.title);
          console.log('Movie genres:', movie.genres);
          
          if (!movie.genres || !Array.isArray(movie.genres)) {
            console.log('Movie has no genres array:', movie.title);
            return false;
          }
          
          // Check each genre in the movie's genres array
          const hasMatchingGenre = movie.genres.some((movieGenre: any) => {
            console.log('Checking genre:', movieGenre);
            
            // Try multiple matching strategies
            const matchById = movieGenre.id && parseInt(movieGenre.id) === genreId;
            const matchByTmdbId = movieGenre.tmdb_id && movieGenre.tmdb_id === genreId;
            const matchByName = genreInfo && movieGenre.name && 
              movieGenre.name.toLowerCase() === genreInfo.name.toLowerCase();
            
            const matches = matchById || matchByTmdbId || matchByName;
            
            console.log('Genre match result:', {
              movieGenre,
              genreId,
              matchById,
              matchByTmdbId,
              matchByName,
              matches
            });
            
            return matches;
          });
          
          console.log('Movie', movie.title, 'has matching genre:', hasMatchingGenre);
          return hasMatchingGenre;
        });
        
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
    
    // If we still have no movies and a genre is selected, let's debug what's available
    if (filteredMovies.length === 0 && selectedGenre && selectedGenre !== 'all') {
      console.log('No movies found for genre. Debugging...');
      console.log('All available movies with their genres:');
      supabaseMovies.slice(0, 5).forEach(movie => {
        console.log(`${movie.title}:`, movie.genres);
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
