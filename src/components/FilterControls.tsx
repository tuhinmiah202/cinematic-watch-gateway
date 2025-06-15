
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Genre {
  id: number;
  name: string;
}

interface FilterControlsProps {
  genres: Genre[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onGenreChange: (value: string) => void;
}

const FilterControls = ({ genres, searchTerm, onSearchTermChange, onGenreChange }: FilterControlsProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <Input
        type="text"
        placeholder="Search for movies & TV shows..."
        className="flex-grow bg-gray-800 text-white border-purple-500/20 rounded-lg"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
      />
      <Select onValueChange={onGenreChange}>
        <SelectTrigger className="w-full md:w-52 bg-gray-800 text-white border-purple-500/20 rounded-lg">
          <SelectValue placeholder="Filter by Genre" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 text-white border-purple-500/20 rounded-lg">
          <SelectItem value="all">All Genres</SelectItem>
          {genres.map((genre) => (
            <SelectItem key={genre.id} value={genre.id.toString()}>
              {genre.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FilterControls;
