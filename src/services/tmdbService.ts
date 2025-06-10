
const TMDB_API_KEY = '566149bf98e53cc39a4c04bfe01c03fc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime: number;
  status: string;
  budget: number;
  revenue: number;
  production_companies: { id: number; name: string; logo_path: string }[];
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
    return response.json();
  },

  async getMoviesByGenre(genreId: number, page = 1): Promise<{ results: Movie[]; total_pages: number }> {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}`
    );
    return response.json();
  },

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`
    );
    return response.json();
  },

  async getGenres(): Promise<{ genres: Genre[] }> {
    const response = await fetch(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );
    return response.json();
  },

  async searchMovies(query: string): Promise<{ results: Movie[]; total_pages: number }> {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    return response.json();
  },

  getImageUrl(path: string): string {
    return path ? `${TMDB_IMAGE_BASE_URL}${path}` : '/placeholder.svg';
  },

  getBackdropUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w1280${path}` : '/placeholder.svg';
  }
};
