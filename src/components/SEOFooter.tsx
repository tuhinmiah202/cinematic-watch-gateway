
const SEOFooter = () => {
  return (
    <div className="mt-12 text-center pb-8">
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
          Complete Movie Database & Recommendations
        </h2>
        
        <p className="text-gray-300 mb-6">
          Whether you're looking for <strong>best action movies</strong>, <strong>top thriller films</strong>, 
          <strong>comedy movies to watch</strong>, <strong>horror movie recommendations</strong>, or 
          <strong>drama film suggestions</strong> - MovieSuggest is your go-to 
          <strong>movie recommendation platform</strong>. Explore <strong>genre-based movie lists</strong>, discover <strong>hidden gems</strong>, 
          find <strong>streaming recommendations</strong>, and get <strong>expert movie reviews</strong>.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
          <div>
            <h3 className="text-white font-semibold mb-3">Popular Movie Genres</h3>
            <ul className="space-y-2">
              <li><strong>Action Movies</strong> - Explosive blockbusters and adventure films</li>
              <li><strong>Thriller Movies</strong> - Suspenseful and mystery films</li>
              <li><strong>Comedy Movies</strong> - Hilarious and entertaining films</li>
              <li><strong>Horror Movies</strong> - Scary and supernatural films</li>
              <li><strong>Drama Movies</strong> - Emotional and powerful storytelling</li>
              <li><strong>Romance Movies</strong> - Love stories and romantic comedies</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3">Movie Recommendations</h3>
            <ul className="space-y-2">
              <li><strong>Top Rated Movies</strong> - Highest rated films of all time</li>
              <li><strong>Must Watch Movies</strong> - Essential cinema experiences</li>
              <li><strong>Hidden Gem Movies</strong> - Underrated and overlooked films</li>
              <li><strong>New Movie Releases</strong> - Latest films and upcoming movies</li>
              <li><strong>Classic Movies</strong> - Timeless cinema masterpieces</li>
              <li><strong>International Films</strong> - World cinema and foreign films</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3">Streaming & Reviews</h3>
            <ul className="space-y-2">
              <li><strong>Streaming Guide</strong> - Where to watch your favorite movies</li>
              <li><strong>Movie Reviews</strong> - Expert analysis and ratings</li>
              <li><strong>What to Watch</strong> - Personalized recommendations</li>
              <li><strong>Movie Lists</strong> - Curated collections by theme</li>
              <li><strong>Film Ratings</strong> - TM ratings and user scores</li>
              <li><strong>Movie News</strong> - Latest updates and releases</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-600">
          <p className="text-xs text-gray-500">
            <strong>Popular Search Terms:</strong> what to watch tonight, movie recommendations, 
            best movies to watch, streaming movie suggestions, top rated films, movie reviews, 
            action movie list, thriller movies, comedy films, horror movies, drama movies
          </p>
        </div>
      </div>
    </div>
  );
};

export default SEOFooter;
