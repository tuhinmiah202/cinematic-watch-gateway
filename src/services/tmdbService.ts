
const TMDB_API_KEY = '566149bf98e53cc39a4c04bfe01c03fc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface Movie {
  id: number;
  title?: string;
  name?: string; // For TV shows
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string; // For TV shows
  genre_ids: number[];
  vote_average?: number; // Make optional since managed content might not have it
  vote_count: number;
  media_type?: string; // 'movie' or 'tv'
  type?: 'movie' | 'series'; // For managed content
  streamingLink?: string; // For managed content
  year?: number; // For managed content
  description?: string; // For managed content
}

export interface MovieDetails extends Movie {
  genres?: { id: number; name: string }[];
  runtime?: number;
  status?: string;
  budget?: number;
  revenue?: number;
  production_companies?: { id: number; name: string; logo_path: string }[];
  number_of_seasons?: number; // For TV shows
  number_of_episodes?: number; // For TV shows
  created_by?: { id: number; name: string }[]; // For TV shows
}

export interface Genre {
  id: number;
  name: string;
}

export const tmdbService = {
  async getPopularMovies(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
    );
    const data = await response.json();
    return {
      results: data.results.map((movie: any) => ({ ...movie, media_type: 'movie' })),
      total_pages: data.total_pages
    };
  },

  async getPopularTVShows(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=${page}`
    );
    const data = await response.json();
    return {
      results: data.results.map((show: any) => ({ ...show, media_type: 'tv' })),
      total_pages: data.total_pages
    };
  },

  async getMoviesByGenre(genreId: number, page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );
    const data = await response.json();
    return {
      results: data.results.map((movie: any) => ({ ...movie, media_type: 'movie' })),
      total_pages: data.total_pages
    };
  },

  async getTVShowsByGenre(genreId: number, page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );
    const data = await response.json();
    return {
      results: data.results.map((show: any) => ({ ...show, media_type: 'tv' })),
      total_pages: data.total_pages
    };
  },

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    return { ...data, media_type: 'movie' };
  },

  async getTVShowDetails(showId: number): Promise<MovieDetails> {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${showId}?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    return { ...data, media_type: 'tv' };
  },

  async getGenres(): Promise<{ genres: Genre[] }> {
    const movieGenresResponse = await fetch(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );
    const tvGenresResponse = await fetch(
      `${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`
    );
    
    const movieGenres = await movieGenresResponse.json();
    const tvGenres = await tvGenresResponse.json();
    
    // Combine and deduplicate genres
    const allGenres = [...movieGenres.genres, ...tvGenres.genres];
    const uniqueGenres = allGenres.filter((genre, index, self) => 
      index === self.findIndex(g => g.id === genre.id)
    );
    
    return { genres: uniqueGenres };
  },

  async searchMovies(query: string, page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    // Use multi-search to get both movies and TV shows
    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );
    const data = await response.json();
    return {
      results: data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv'),
      total_pages: data.total_pages
    };
  },

  getImageUrl(path: string): string {
    return path ? `${TMDB_IMAGE_BASE_URL}${path}` : '/placeholder.svg';
  },

  getBackdropUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w1280${path}` : '/placeholder.svg';
  }
};
