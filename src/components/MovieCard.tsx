
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { tmdbService } from '@/services/tmdbService';
import { Star, Calendar, Tv } from 'lucide-react';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  poster_url?: string;
  release_date?: string;
  first_air_date?: string;
  release_year?: number;
  vote_average?: number;
  rating?: number;
  media_type?: string;
  content_type?: string;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
}

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Function to determine if content is from Supabase
  const isSupabaseContent = !!(movie as any).content_type;
  
  const title = isSupabaseContent ? movie.title : (movie.title || movie.name || 'Untitled');
  const posterUrl = isSupabaseContent 
    ? (movie as any).poster_url || '/placeholder.svg'
    : tmdbService.getImageUrl(movie.poster_path);
    
  const releaseDate = isSupabaseContent 
    ? movie.release_year 
    : (movie.release_date || movie.first_air_date);
  const year = isSupabaseContent 
    ? movie.release_year 
    : (releaseDate ? new Date(releaseDate).getFullYear() : 'N/A');
    
  const rating = isSupabaseContent 
    ? (movie as any).rating 
    : movie.vote_average;

  // Determine if it's a TV show
  const isTV = isSupabaseContent 
    ? (movie as any).content_type === 'series'
    : movie.media_type === 'tv' || movie.name || !movie.title;

  // No need for complex back params - browser history handles it

  return (
    <Link 
      to={`/movie/${movie.id}`}
      className="group block"
    >
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-700/50 hover:border-purple-500/50">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          {rating && rating > 0 && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-xs font-semibold">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
          {isTV && (
            <div className="absolute top-2 left-2 bg-purple-600/90 backdrop-blur-sm rounded-full p-1">
              <Tv className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2 group-hover:text-purple-300 transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{year}</span>
            </div>
            {isTV && (
              <span className="text-purple-400 font-medium">Series</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
