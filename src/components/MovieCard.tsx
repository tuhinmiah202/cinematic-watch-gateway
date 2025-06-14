import { Movie, tmdbService } from '@/services/tmdbService';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, Calendar, Tv } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const [searchParams] = useSearchParams();
  
  // Preserve current search parameters in the link
  const currentSearch = searchParams.get('search') || '';
  const currentGenre = searchParams.get('genre') || '';
  const currentType = searchParams.get('type') || '';
  const currentPage = searchParams.get('page') || '';
  
  // Build query string to preserve state
  const queryParams = new URLSearchParams();
  if (currentSearch) queryParams.set('search', currentSearch);
  if (currentGenre) queryParams.set('genre', currentGenre);
  if (currentType) queryParams.set('type', currentType);
  if (currentPage) queryParams.set('page', currentPage);
  
  const backParams = queryParams.toString();
  
  // Determine the correct link path
  const linkPath = (movie as any).supabaseId 
    ? `/movie/${(movie as any).supabaseId}${backParams ? `?back=${encodeURIComponent(backParams)}` : ''}`
    : `/movie/${movie.id}${backParams ? `?back=${encodeURIComponent(backParams)}` : ''}`;

  // Get the correct title and release date based on movie type
  const title = movie.title || movie.name || 'Untitled';
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = movie.year || (releaseDate ? new Date(releaseDate).getFullYear() : 'N/A');
  const rating = movie.vote_average || 0;
  const isTV = movie.media_type === 'tv' || movie.type === 'series' || movie.name;
  
  // Handle poster URL for both TMDB and Supabase content
  const posterUrl = (movie as any).poster_url || tmdbService.getImageUrl(movie.poster_path);

  return (
    <Link 
      to={linkPath}
      className="group relative overflow-hidden rounded-lg bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
      <div className="aspect-[2/3] relative">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge - smaller and positioned better */}
        {rating > 0 && (
          <div className="absolute top-1 right-1 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-current" />
            {rating.toFixed(1)}
          </div>
        )}

        {/* TV Show indicator - smaller */}
        {isTV && (
          <div className="absolute top-1 left-1 bg-purple-600 text-white px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
            <Tv className="w-2.5 h-2.5" />
            TV
          </div>
        )}

        {/* Admin content indicator - smaller */}
        {(movie as any).supabaseId && (
          <div className="absolute bottom-1 right-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
            ✓
          </div>
        )}
      </div>
      
      {/* Movie Info Overlay - more compact */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-bold text-sm mb-1 line-clamp-2">{title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-300">
          <Calendar className="w-3 h-3" />
          {year}
          {isTV && (
            <>
              <span>•</span>
              <Tv className="w-3 h-3" />
              <span>Series</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
