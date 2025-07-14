
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NavbarProps {
  onSearch: (query: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <>
      {/* Top bar with website name */}
      <div className="bg-black/80 backdrop-blur-md border-b border-purple-500/10 py-2">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Link to="/" className="text-lg font-bold">
              <span className="bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Movie Suggestion
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="bg-black/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Now shows CineStream */}
            <Link to="/" className="text-xl font-bold">
              <span className="bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
                CineStream
              </span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/80 border-gray-700 text-white placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
              <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                Search
              </Button>
            </form>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-white hover:text-purple-400 transition-colors font-medium">
                Home
              </Link>
              <Link to="/admin" className="text-white hover:text-purple-400 transition-colors font-medium">
                Admin
              </Link>
              <Link to="/privacy" className="text-white hover:text-purple-400 transition-colors font-medium">
                Privacy Policy
              </Link>
              <Link to="/about" className="text-white hover:text-purple-400 transition-colors font-medium">
                About
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-purple-600/20"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/80 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
                <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Search
                </Button>
              </form>
              <div className="flex flex-col gap-2">
                <Link to="/" className="text-white hover:text-purple-400 transition-colors py-2 font-medium">
                  Home
                </Link>
                <Link to="/admin" className="text-white hover:text-purple-400 transition-colors py-2 font-medium">
                  Admin
                </Link>
                <Link to="/privacy" className="text-white hover:text-purple-400 transition-colors py-2 font-medium">
                  Privacy Policy
                </Link>
                <Link to="/about" className="text-white hover:text-purple-400 transition-colors py-2 font-medium">
                  About
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
