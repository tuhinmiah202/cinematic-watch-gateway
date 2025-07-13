
interface SEOHeaderProps {
  selectedGenre: string;
  genres: any[];
  showHomeSections: boolean;
}

const SEOHeader = ({ selectedGenre, genres, showHomeSections }: SEOHeaderProps) => {
  // Get SEO-friendly title based on selected genre
  const getGenrePageTitle = () => {
    if (!selectedGenre || !genres.length) return null;
    
    const genre = genres.find(g => g.id.toString() === selectedGenre);
    if (!genre) return null;
    
    const genreKeywords = {
      'Action': 'Best Action Movies - Thrilling Adventures & Blockbusters',
      'Adventure': 'Best Adventure Movies - Epic Journeys & Quests',
      'Comedy': 'Best Comedy Movies - Hilarious Films & Funny Movies',
      'Drama': 'Best Drama Movies - Powerful Stories & Emotional Films',
      'Horror': 'Best Horror Movies - Scary Films & Thriller Movies',
      'Romance': 'Best Romance Movies - Love Stories & Romantic Films',
      'Thriller': 'Best Thriller Movies - Suspenseful & Mystery Films',
      'Sci-Fi': 'Best Sci-Fi Movies - Science Fiction & Futuristic Films',
      'Fantasy': 'Best Fantasy Movies - Magical Adventures & Epic Tales',
      'Crime': 'Best Crime Movies - Detective Stories & Criminal Dramas',
      'Mystery': 'Best Mystery Movies - Puzzling Stories & Detective Films',
      'Animation': 'Best Animated Movies - Family Films & Cartoon Adventures',
      'Family': 'Best Family Movies - Kid-Friendly Films & Entertainment',
      'War': 'Best War Movies - Military Films & Historical Battles',
      'Western': 'Best Western Movies - Cowboy Films & Frontier Stories',
      'Music': 'Best Music Movies - Musical Films & Concert Movies',
      'Documentary': 'Best Documentary Movies - Educational & Real Stories',
      'History': 'Best Historical Movies - Period Films & True Stories'
    };
    
    return genreKeywords[genre.name] || `Best ${genre.name} Movies - Top Rated ${genre.name} Films`;
  };

  if (selectedGenre && getGenrePageTitle()) {
    return (
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {getGenrePageTitle()}
        </h1>
        <p className="text-base text-gray-300 max-w-3xl mx-auto mb-4">
          Discover the finest collection of {genres.find(g => g.id.toString() === selectedGenre)?.name.toLowerCase()} movies. 
          Our curated selection features <strong>top-rated {genres.find(g => g.id.toString() === selectedGenre)?.name.toLowerCase()} films</strong>, 
          <strong> must-watch {genres.find(g => g.id.toString() === selectedGenre)?.name.toLowerCase()} movies</strong>, and 
          <strong> popular {genres.find(g => g.id.toString() === selectedGenre)?.name.toLowerCase()} recommendations</strong> 
          with detailed reviews and ratings.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400 mb-4">
          <div>🎬 Top Rated Films</div>
          <div>⭐ Expert Reviews</div>
          <div>🎯 Curated Selection</div>
          <div>📊 Detailed Ratings</div>
        </div>
      </div>
    );
  }

  if (showHomeSections) {
    return (
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Movie Suggestion
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-purple-300 mb-4">
          Best Movie Recommendations & Streaming Guide
        </h2>
        <p className="text-base text-gray-300 max-w-3xl mx-auto mb-4">
          Discover <strong>top-rated movies</strong>, explore <strong>action movie recommendations</strong>, 
          find <strong>thriller movies to watch</strong>, and get expert guides for popular genres. 
          Your ultimate destination for <strong>movie recommendations</strong> and <strong>streaming suggestions</strong>.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400 mb-4">
          <div>🎬 Action Movies</div>
          <div>🎭 Drama Films</div>
          <div>😂 Comedy Movies</div>
          <div>👻 Horror Films</div>
        </div>
      </div>
    );
  }

  return null;
};

export default SEOHeader;
