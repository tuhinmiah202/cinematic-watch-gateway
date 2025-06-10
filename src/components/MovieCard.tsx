
import { Movie, tmdbService } from '@/services/tmdbService';
import { Link } from 'react-router-dom';
import { Star, Calendar } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  return (
    <Link 
      to={`/movie/${movie.id}`} 
      className="group relative overflow-hidden rounded-xl bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
    >
      <div className="aspect-[2/3] relative">
        <img
          src={tmdbService.getImageUrl(movie.poster_path)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          {movie.vote_average.toFixed(1)}
        </div>
      </div>
      
      {/* Movie Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{movie.title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Calendar className="w-4 h-4" />
          {new Date(movie.release_date).getFullYear()}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
