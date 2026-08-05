
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';

export const useHomeSections = () => {
  const { data: sections, isLoading } = useQuery({
    queryKey: ['home-sections'],
    queryFn: async () => {
      const [
        trending,
        nowPlaying,
        upcoming,
        topRatedTV,
        topRatedMovies
      ] = await Promise.all([
        tmdbService.getTrending('all', 'day'),
        tmdbService.getNowPlayingMovies(1),
        tmdbService.getUpcomingMovies(1),
        tmdbService.getTopRatedTVShows(1),
        tmdbService.getPopularMovies(1) // Using popular as a proxy for "greatest"
      ]);

      return {
        trending: trending.results || [],
        newReleases: nowPlaying.results || [],
        upcoming: upcoming.results || [],
        highestRatedSeries: topRatedTV.results || [],
        highestRatedMovies: topRatedMovies.results || [],
        greatestMovies: topRatedMovies.results.filter(m => (m.vote_average || 0) >= 8) || []
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    trending: sections?.trending || [],
    newReleases: sections?.newReleases || [],
    upcoming: sections?.upcoming || [],
    greatestMovies: sections?.greatestMovies || [],
    highestRatedMovies: sections?.highestRatedMovies || [],
    highestRatedSeries: sections?.highestRatedSeries || [],
    isLoading
  };
};
