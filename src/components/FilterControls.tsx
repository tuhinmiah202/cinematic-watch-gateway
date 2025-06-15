
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Genre {
  id: number;
  name: string;
}

interface FilterControlsProps {
  genres: Genre[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onGenreChange: (value: string) => void;
  contentType: string;
  onContentTypeChange: (type: string) => void;
}

const FilterControls = ({ genres, searchTerm, onSearchTermChange, onGenreChange, contentType, onContentTypeChange }: FilterControlsProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          type="text"
          placeholder="Search for movies & TV shows..."
          className="flex-grow bg-gray-800 text-white border-purple-500/20 rounded-lg"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
        <Select onValueChange={onGenreChange} defaultValue="">
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
      <ToggleGroup
        type="single"
        value={contentType}
        onValueChange={(value) => value && onContentTypeChange(value)}
        className="justify-start flex-wrap gap-2"
        defaultValue="all"
      >
        <ToggleGroupItem value="all" className="bg-gray-800/50 text-gray-300 border-purple-500/20 rounded-md data-[state=on]:bg-purple-600 data-[state=on]:text-white hover:bg-gray-700/50">All</ToggleGroupItem>
        <ToggleGroupItem value="movie" className="bg-gray-800/50 text-gray-300 border-purple-500/20 rounded-md data-[state=on]:bg-purple-600 data-[state=on]:text-white hover:bg-gray-700/50">Movies</ToggleGroupItem>
        <ToggleGroupItem value="tv" className="bg-gray-800/50 text-gray-300 border-purple-500/20 rounded-md data-[state=on]:bg-purple-600 data-[state=on]:text-white hover:bg-gray-700/50">TV Series</ToggleGroupItem>
        <ToggleGroupItem value="animation" className="bg-gray-800/50 text-gray-300 border-purple-500/20 rounded-md data-[state=on]:bg-purple-600 data-[state=on]:text-white hover:bg-gray-700/50">Animation</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default FilterControls;
