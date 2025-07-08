
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';

export const useHomeSections = () => {
  // Get new releases (recent movies/TV shows)
  const { data: newReleases, isLoading: isLoadingNewReleases } = useQuery({
    queryKey: ['new-releases'],
    queryFn: async () => {
      const [movies, tvShows] = await Promise.all([
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1)
      ]);
      
      // Combine and sort by release date (most recent first)
      const combined = [...movies.results, ...tvShows.results];
      return combined
        .filter(item => {
          const releaseDate = item.release_date || item.first_air_date;
          if (!releaseDate) return false;
          const date = new Date(releaseDate);
          const now = new Date();
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6);
          return date >= sixMonthsAgo;
        })
        .sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date || '');
          const dateB = new Date(b.release_date || b.first_air_date || '');
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 20);
    },
  });

  // Get highest rated movies (8+ rating)
  const { data: greatestMovies, isLoading: isLoadingGreatest } = useQuery({
    queryKey: ['greatest-movies'],
    queryFn: async () => {
      const movies = await tmdbService.getPopularMovies(1);
      return movies.results
        .filter(movie => (movie.vote_average || 0) >= 8.0)
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 15);
    },
  });

  // Get highest rated movies (7+ rating)
  const { data: highestRatedMovies, isLoading: isLoadingHighestMovies } = useQuery({
    queryKey: ['highest-rated-movies'],
    queryFn: async () => {
      const [page1, page2] = await Promise.all([
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularMovies(2)
      ]);
      
      const allMovies = [...page1.results, ...page2.results];
      return allMovies
        .filter(movie => (movie.vote_average || 0) >= 7.0)
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 15);
    },
  });

  // Get highest rated series (7+ rating)
  const { data: highestRatedSeries, isLoading: isLoadingHighestSeries } = useQuery({
    queryKey: ['highest-rated-series'],
    queryFn: async () => {
      const [page1, page2] = await Promise.all([
        tmdbService.getPopularTVShows(1),
        tmdbService.getPopularTVShows(2)
      ]);
      
      const allSeries = [...page1.results, ...page2.results];
      return allSeries
        .filter(series => (series.vote_average || 0) >= 7.0)
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 15);
    },
  });

  // Get mixed content (movies and series)
  const { data: mixedContent, isLoading: isLoadingMixed } = useQuery({
    queryKey: ['mixed-content'],
    queryFn: async () => {
      const [supabaseContent, movies, tvShows] = await Promise.all([
        contentService.getApprovedContent(),
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1)
      ]);
      
      const combined = [
        ...supabaseContent.slice(0, 10),
        ...movies.results.slice(0, 10),
        ...tvShows.results.slice(0, 10)
      ];
      
      // Shuffle the array for mixed content
      return combined.sort(() => Math.random() - 0.5).slice(0, 20);
    },
  });

  return {
    newReleases: newReleases || [],
    greatestMovies: greatestMovies || [],
    highestRatedMovies: highestRatedMovies || [],
    highestRatedSeries: highestRatedSeries || [],
    mixedContent: mixedContent || [],
    isLoading: isLoadingNewReleases || isLoadingGreatest || isLoadingHighestMovies || isLoadingHighestSeries || isLoadingMixed
  };
};
