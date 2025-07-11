import { ArrowLeft, Play, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-black/50 text-white border-white/20 hover:bg-white/10"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">
            About <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">CineStream</span>
          </h1>
          
          <div className="text-center mb-12">
            <p className="text-xl text-gray-300 leading-relaxed">
              Your ultimate destination for discovering and streaming the best movies and TV shows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center">
              <Play className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Extensive Library</h3>
              <p className="text-gray-300">
                Access thousands of movies and TV shows from various genres and eras
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center">
              <Star className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Quality Content</h3>
              <p className="text-gray-300">
                Curated selection of high-quality content with detailed reviews and ratings
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
              <p className="text-gray-300">
                Join a community of movie enthusiasts and discover new favorites
              </p>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
            <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              At CineStream, we believe that great entertainment should be accessible to everyone. 
              Our platform is designed to help you discover your next favorite movie or TV show 
              through personalized recommendations and comprehensive content information.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              We aggregate content from various streaming platforms and provide detailed information 
              including cast details, reviews, ratings, and availability across different services. 
              Our goal is to make your entertainment discovery journey as smooth and enjoyable as possible.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Whether you're looking for the latest blockbusters, classic films, or hidden gems, 
              CineStream is your trusted companion in the world of digital entertainment.
            </p>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">🔍 Advanced Search</h3>
                <p className="text-gray-300 text-sm">Find content by title, genre, cast, or year</p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">⭐ TM Ratings</h3>
                <p className="text-gray-300 text-sm">Get reliable ratings from The Movie Database</p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">📱 Mobile Friendly</h3>
                <p className="text-gray-300 text-sm">Optimized experience across all devices</p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">🎯 Personalized</h3>
                <p className="text-gray-300 text-sm">Get recommendations based on your preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;