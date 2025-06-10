
import { Genre } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';

interface GenreFilterProps {
  genres: Genre[];
  selectedGenre: number | null;
  onGenreSelect: (genreId: number | null) => void;
}

const GenreFilter = ({ genres, selectedGenre, onGenreSelect }: GenreFilterProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Browse by Genre</h2>
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedGenre === null ? "default" : "outline"}
          onClick={() => onGenreSelect(null)}
          className="rounded-full"
        >
          All Movies
        </Button>
        {genres.map((genre) => (
          <Button
            key={genre.id}
            variant={selectedGenre === genre.id ? "default" : "outline"}
            onClick={() => onGenreSelect(genre.id)}
            className="rounded-full"
          >
            {genre.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GenreFilter;
