import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movieboxService } from '@/services/movieboxService';
import MovieBoxCard from '@/components/MovieBoxCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

type Tab = 'home' | 'movies' | 'series';

const MovieBoxBrowse = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { data: sections = [], isLoading: loadingHome } = useQuery({
    queryKey: ['mb-home'],
    queryFn: () => movieboxService.getHome(),
    enabled: tab === 'home' && !debouncedQuery,
  });

  const { data: list, isLoading: loadingList } = useQuery({
    queryKey: ['mb-list', tab, page],
    queryFn: () => (tab === 'movies' ? movieboxService.getMovies(page) : movieboxService.getSeries(page)),
    enabled: (tab === 'movies' || tab === 'series') && !debouncedQuery,
  });

  const { data: results, isLoading: loadingSearch } = useQuery({
    queryKey: ['mb-search', debouncedQuery],
    queryFn: () => movieboxService.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });

  const switchTab = (t: Tab) => {
    setTab(t);
    setPage(1);
  };

  const isSearching = debouncedQuery.length > 1;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Browse Library</h1>
          <p className="text-muted-foreground text-sm">
            Movies, series and streaming powered by your own API server.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies & series..."
              className="pl-11 h-12 rounded-2xl bg-card border-white/10"
            />
          </div>
          {!isSearching && (
            <div className="flex gap-2">
              {(['home', 'movies', 'series'] as Tab[]).map((t) => (
                <Button
                  key={t}
                  onClick={() => switchTab(t)}
                  variant={tab === t ? 'default' : 'outline'}
                  className="rounded-full capitalize"
                >
                  {t === 'series' ? 'TV Series' : t}
                </Button>
              ))}
            </div>
          )}
        </header>

        {(loadingHome || loadingList || loadingSearch) && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}

        {isSearching && results && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Results for “{debouncedQuery}”</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-5">
              {results.items?.map((item) => <MovieBoxCard key={item.subject_id} item={item} />)}
            </div>
          </section>
        )}

        {!isSearching && tab === 'home' &&
          sections.map((section) => (
            <section key={section.section} className="space-y-4">
              <h2 className="text-xl font-bold">{section.section}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-5">
                {section.items.slice(0, 12).map((item) => (
                  <MovieBoxCard key={`${section.section}-${item.subject_id}`} item={item} />
                ))}
              </div>
            </section>
          ))}

        {!isSearching && tab !== 'home' && list && (
          <section className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-5">
              {list.items?.map((item) => <MovieBoxCard key={item.subject_id} item={item} />)}
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!list.has_more}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default MovieBoxBrowse;
