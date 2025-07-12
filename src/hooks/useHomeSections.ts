
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/services/contentService';

export const useHomeSections = () => {
  // Get all user-added content from Supabase
  const { data: allContent, isLoading } = useQuery({
    queryKey: ['home-sections-content'],
    queryFn: () => contentService.getApprovedContent(),
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

    // Get greatest movies (8+ rating)
    processedSections.greatestMovies = allContent
      .filter(item => item.content_type === 'movie' && (item.rating || 0) >= 8.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 15);

    // Get highest rated movies (7+ rating)
    processedSections.highestRatedMovies = allContent
      .filter(item => item.content_type === 'movie' && (item.rating || 0) >= 7.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 15);

    // Get highest rated series (7+ rating)
    processedSections.highestRatedSeries = allContent
      .filter(item => item.content_type === 'series' && (item.rating || 0) >= 7.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 15);
  }

  return {
    ...processedSections,
    isLoading
  };
};
