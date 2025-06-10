
import { Genre } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';

interface GenreFilterProps {
  genres: Genre[];
  selectedGenre: number | null;
  onGenreSelect: (genreId: number | null) => void;
}

const GenreFilter = ({ genres, selectedGenre, onGenreSelect }: GenreFilterProps) => {
  // Add custom genres
  const customGenres = [
    { id: 999, name: 'Bollywood' },
    { id: 998, name: 'K-Drama' }
  ];

  const allGenres = [...genres, ...customGenres];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Browse by Genre</h2>
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedGenre === null ? "default" : "outline"}
          onClick={() => onGenreSelect(null)}
          className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          All Movies
        </Button>
        {allGenres.map((genre) => (
          <Button
            key={genre.id}
            variant={selectedGenre === genre.id ? "default" : "outline"}
            onClick={() => onGenreSelect(genre.id)}
            className={`rounded-full transition-all duration-300 ${
              selectedGenre === genre.id 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                : 'bg-transparent border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white'
            } ${
              (genre.name === 'Bollywood' || genre.name === 'K-Drama') 
                ? 'border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold' 
                : ''
            }`}
          >
            {genre.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GenreFilter;
