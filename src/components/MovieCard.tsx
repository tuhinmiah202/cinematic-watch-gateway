
import { Link, useNavigate } from 'react-router-dom';
import { tmdbService } from '@/services/tmdbService';
import { Star, Calendar, Play } from 'lucide-react';

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
}

interface MovieCardProps {
  movie: Movie;
  isCompact?: boolean;
}

const MovieCard = ({ movie, isCompact = false }: MovieCardProps) => {
  const navigate = useNavigate();

  const title = movie.title || movie.name || 'Untitled';
  const posterUrl = movie.poster_url || tmdbService.getImageUrl(movie.poster_path || '');
    
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = movie.release_year || (releaseDate ? new Date(releaseDate).getFullYear() : 'N/A');
    
  const rating = movie.vote_average || movie.rating || 0;
  const isTV = movie.media_type === 'tv' || !!movie.name;
  const detailPath = `/movie/${movie.id}?type=${isTV ? 'tv' : 'movie'}`;

  if (isCompact) {
    return (
      <Link 
        to={detailPath}
        className="group relative block aspect-[2/3] rounded-xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 active:scale-95 hover:z-10"
      >
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <h3 className="text-white text-xs font-bold truncate mb-1">{title}</h3>
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-purple-400 font-bold uppercase">{isTV ? 'TV' : 'Movie'}</span>
                <span className="text-[10px] text-gray-300">{year}</span>
            </div>
        </div>
        {rating > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-lg px-1.5 py-0.5 flex items-center gap-1 border border-white/10">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            <span className="text-white text-[10px] font-black">{rating.toFixed(1)}</span>
          </div>
        )}
      </Link>
    );
  }

  return (
    <div className="group relative flex flex-col gap-2">
      <Link
        to={detailPath}
        className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-purple-500/20 hover:-translate-y-2 group"
      >
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-purple-600 rounded-full p-4 transform scale-50 group-hover:scale-100 transition-transform duration-300">
                <Play className="w-8 h-8 fill-white text-white translate-x-0.5" />
            </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white border border-white/10 uppercase tracking-tighter">
                {isTV ? 'TV Series' : 'Movie'}
            </span>
        </div>

        {rating > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-xl px-2 py-1 flex items-center gap-1 border border-white/10">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-white text-xs font-black">{rating.toFixed(1)}</span>
          </div>
        )}
      </Link>

      <div className="px-1 mt-1">
        <h3 className="text-white text-sm md:text-base font-bold truncate group-hover:text-purple-400 transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-medium mt-0.5">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{year}</span>
          </div>
          <span>•</span>
          <span className="text-gray-400">{isTV ? 'Series' : 'Feature Film'}</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
