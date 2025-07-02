
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

  // Initial fetch of Supabase content
  const {
    data: initialSupabaseData,
    isLoading: isLoadingSupabaseInitial,
  } = useQuery({
    queryKey: ['supabase-content-initial'],
    queryFn: () => contentService.getApprovedContent(),
  });

  // Update supabaseMovies when data is fetched
  useEffect(() => {
    if (initialSupabaseData) {
      setSupabaseMovies(initialSupabaseData);
    }
  }, [initialSupabaseData]);

  // Fetch TMDB movies and TV shows
  const {
    data: tmdbData,
    isLoading: isLoadingTmdb,
  } = useQuery({
    queryKey: ['tmdb-content', selectedGenre, debouncedSearchTerm, contentType],
    queryFn: async () => {
      const pagePromises: Promise<{ results: any[], total_pages: number }>[] = [];
      const fetchMovies = contentType === 'all' || contentType === 'movie' || contentType === 'animation';
      const fetchTV = contentType === 'all' || contentType === 'tv' || contentType === 'animation';

      if (debouncedSearchTerm) {
        // Use searchMovies for both movies and TV shows since it uses multi-search
        for (let i = 1; i <= 2; i++) {
          pagePromises.push(tmdbService.searchMovies(debouncedSearchTerm, i));
        }
      } else if (selectedGenre && selectedGenre !== 'all') {
        const genreId = parseInt(selectedGenre);
        if (fetchMovies) pagePromises.push(tmdbService.getMoviesByGenre(genreId, 1));
        if (fetchTV) pagePromises.push(tmdbService.getTVShowsByGenre(genreId, 1));
      } else {
        if (fetchMovies) pagePromises.push(tmdbService.getPopularMovies(1));
        if (fetchTV) pagePromises.push(tmdbService.getPopularTVShows(1));
      }

      const pagesData = await Promise.all(pagePromises);
      return pagesData;
    },
  });

  // Combine and filter movies
  const allMovies = useCallback(() => {
    let combinedMovies: any[] = [...supabaseMovies];

    if (tmdbData) {
      tmdbData.forEach((page) => {
        if (page && page.results) {
          combinedMovies = combinedMovies.concat(page.results);
        }
      });
    }
    
    const movieMap = new Map();
    combinedMovies.forEach(movie => {
        if (movie && movie.id && !movieMap.has(movie.id)) {
            movieMap.set(movie.id, movie);
        }
    });
    let filteredMovies = Array.from(movieMap.values());

    const isMovie = (movie: any) => {
      if (isSupabaseContent(movie)) {
        return movie.content_type === 'movie';
      } else {
        return movie.media_type === 'movie' || (movie.hasOwnProperty('release_date') || (!movie.hasOwnProperty('first_air_date') && movie.title));
      }
    };
    
    const isTvShow = (movie: any) => {
      if (isSupabaseContent(movie)) {
        return movie.content_type === 'series';
      } else {
        return movie.media_type === 'tv' || movie.hasOwnProperty('first_air_date') || movie.name;
      }
    };
    
    if (contentType === 'movie') {
      filteredMovies = filteredMovies.filter(isMovie);
    } else if (contentType === 'tv') {
      filteredMovies = filteredMovies.filter(isTvShow);
    } else if (contentType === 'animation') {
      const animationGenreId = 16;
      const genreInfo = genres.find(g => g.id === animationGenreId);
      
      filteredMovies = filteredMovies.filter((movie) => {
        if (isSupabaseContent(movie)) {
          return movie.genres?.some((g: any) => g.id === animationGenreId || (genreInfo && g.name === genreInfo.name));
        } else {
          return movie.genre_ids?.includes(animationGenreId);
        }
      });
    }

    if (selectedGenre && selectedGenre !== 'all') {
      const genreId = parseInt(selectedGenre);
      const genreInfo = genres.find(g => g.id === genreId);
      
      filteredMovies = filteredMovies.filter((movie) => {
        if (isSupabaseContent(movie)) {
          return movie.genres?.some((g: any) => g.id === genreId || (genreInfo && g.name === genreInfo.name));
        } else {
          return movie.genre_ids?.includes(genreId);
        }
      });
    }

    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filteredMovies = filteredMovies.filter((movie) => {
        const title = isSupabaseContent(movie) ? movie.title : movie.title || movie.name;
        return title?.toLowerCase().includes(lowerSearchTerm);
      });
    }

    return filteredMovies;
  }, [supabaseMovies, tmdbData, selectedGenre, debouncedSearchTerm, genres, contentType]);

  return {
    genres,
    allMovies: allMovies(),
    isLoading: isLoadingSupabaseInitial || isLoadingTmdb,
  };
};
