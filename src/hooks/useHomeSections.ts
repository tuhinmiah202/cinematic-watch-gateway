
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/services/contentService';

export const useHomeSections = () => {
  // Get all user-added content from Supabase
  // Use shared query key to avoid duplicate fetches with useMovieData
  const { data: allContent, isLoading } = useQuery({
    queryKey: ['approved-content'],
    queryFn: () => contentService.getApprovedContent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process the content into different sections
  const processedSections = {
    newReleases: [] as any[],
    greatestMovies: [] as any[],
    highestRatedMovies: [] as any[],
    highestRatedSeries: [] as any[]
  };

  if (allContent) {
    // Get new releases (recent content based on created_at or release_year)
    const currentYear = new Date().getFullYear();
    processedSections.newReleases = allContent
      .filter(item => {
        const releaseYear = item.release_year || new Date(item.created_at || '').getFullYear();
        return releaseYear >= currentYear - 2; // Last 2 years
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
      })
      .slice(0, 20);

    // Get greatest movies (fallback to release_year for sorting if no rating)
    processedSections.greatestMovies = allContent
      .filter(item => item.content_type === 'movie')
      .sort((a, b) => {
        const ratingA = (a as any).rating || 0;
        const ratingB = (b as any).rating || 0;
        if (ratingA === ratingB) {
          return (b.release_year || 0) - (a.release_year || 0);
        }
        return ratingB - ratingA;
      })
      .slice(0, 15);

    // Get highest rated movies (fallback to release_year for sorting if no rating)
    processedSections.highestRatedMovies = allContent
      .filter(item => item.content_type === 'movie')
      .sort((a, b) => {
        const ratingA = (a as any).rating || 0;
        const ratingB = (b as any).rating || 0;
        if (ratingA === ratingB) {
          return (b.release_year || 0) - (a.release_year || 0);
        }
        return ratingB - ratingA;
      })
      .slice(0, 15);

    // Get highest rated series (fallback to release_year for sorting if no rating)
    processedSections.highestRatedSeries = allContent
      .filter(item => item.content_type === 'series')
      .sort((a, b) => {
        const ratingA = (a as any).rating || 0;
        const ratingB = (b as any).rating || 0;
        if (ratingA === ratingB) {
          return (b.release_year || 0) - (a.release_year || 0);
        }
        return ratingB - ratingA;
      })
      .slice(0, 15);
  }

  return {
    ...processedSections,
    isLoading
  };
};
