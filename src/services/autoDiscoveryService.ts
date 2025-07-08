
import { tmdbService } from './tmdbService';
import { submissionService } from './submissionService';
import { contentService } from './contentService';

export const autoDiscoveryService = {
  async discoverNewMovies(): Promise<void> {
    try {
      console.log('Starting auto-discovery for new movies...');
      
      // Get existing content from our database
      const existingContent = await contentService.getApprovedContent();
      const existingTmdbIds = new Set(existingContent.map(item => item.tmdb_id).filter(Boolean));
      
      // Get pending submissions to avoid duplicates
      const pendingSubmissions = await submissionService.getPendingSubmissions();
      const pendingTmdbIds = new Set(pendingSubmissions.map(item => item.tmdb_id));
      
      // Fetch popular movies from TMDB
      const popularMovies = await tmdbService.getPopularMovies(1);
      const nowPlayingMovies = await tmdbService.getNowPlayingMovies();
      
      // Combine and filter out existing content
      const allMovies = [...popularMovies.results, ...nowPlayingMovies.results];
      const newMovies = allMovies.filter(movie => 
        !existingTmdbIds.has(movie.id) && 
        !pendingTmdbIds.has(movie.id) &&
        movie.vote_average && movie.vote_average >= 6.0 // Only high-quality content
      );
      
      // Submit new movies for approval (limit to prevent spam)
      const moviesToSubmit = newMovies.slice(0, 5);
      
      for (const movie of moviesToSubmit) {
        const success = await submissionService.submitForApproval(movie);
        if (success) {
          console.log(`Submitted movie for approval: ${movie.title}`);
        }
      }
      
      console.log(`Auto-discovery completed. Submitted ${moviesToSubmit.length} movies for approval.`);
    } catch (error) {
      console.error('Error in auto-discovery:', error);
    }
  },

  async discoverNewTVShows(): Promise<void> {
    try {
      console.log('Starting auto-discovery for new TV shows...');
      
      // Get existing content from our database
      const existingContent = await contentService.getApprovedContent();
      const existingTmdbIds = new Set(existingContent.map(item => item.tmdb_id).filter(Boolean));
      
      // Get pending submissions to avoid duplicates
      const pendingSubmissions = await submissionService.getPendingSubmissions();
      const pendingTmdbIds = new Set(pendingSubmissions.map(item => item.tmdb_id));
      
      // Fetch popular TV shows from TMDB
      const popularTVShows = await tmdbService.getPopularTVShows(1);
      const topRatedTVShows = await tmdbService.getTopRatedTVShows();
      
      // Combine and filter out existing content
      const allTVShows = [...popularTVShows.results, ...topRatedTVShows.results];
      const newTVShows = allTVShows.filter(show => 
        !existingTmdbIds.has(show.id) && 
        !pendingTmdbIds.has(show.id) &&
        show.vote_average && show.vote_average >= 6.0 // Only high-quality content
      );
      
      // Submit new TV shows for approval (limit to prevent spam)
      const showsToSubmit = newTVShows.slice(0, 5);
      
      for (const show of showsToSubmit) {
        const success = await submissionService.submitForApproval({
          ...show,
          media_type: 'tv'
        });
        if (success) {
          console.log(`Submitted TV show for approval: ${show.name}`);
        }
      }
      
      console.log(`Auto-discovery completed. Submitted ${showsToSubmit.length} TV shows for approval.`);
    } catch (error) {
      console.error('Error in TV show auto-discovery:', error);
    }
  },

  async runAutoDiscovery(): Promise<void> {
    await Promise.all([
      this.discoverNewMovies(),
      this.discoverNewTVShows()
    ]);
  }
};
