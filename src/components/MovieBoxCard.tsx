import { Link } from 'react-router-dom';
import { Star, Play } from 'lucide-react';
import type { MBItem } from '@/services/movieboxService';

const MovieBoxCard = ({ item }: { item: MBItem }) => {
  const poster = item.poster_url || item.image_url || '/placeholder.svg';
  const rating = parseFloat(item.rating || '0');

  return (
    <Link to={`/mb/${item.slug}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 border border-white/5">
        <img
          src={poster}
          alt={`${item.name} poster`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-70" />
        {rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {rating.toFixed(1)}
          </div>
        )}
        {item.badge && (
          <div className="absolute top-2 left-2 bg-primary/90 px-2 py-1 rounded-full text-[9px] font-black uppercase">
            {item.badge}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
            <Play className="w-5 h-5 fill-white" />
          </div>
        </div>
      </div>
      <h3 className="mt-2 text-sm font-semibold line-clamp-1">{item.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-1">
        {[item.year, item.genre].filter(Boolean).join(' • ')}
      </p>
    </Link>
  );
};

export default MovieBoxCard;
