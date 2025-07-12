
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface HomePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  totalItems: number;
}

const HomePagination = ({ currentPage, totalPages, onPageChange, isLoading, totalItems }: HomePaginationProps) => {
  if (totalPages <= 1 || isLoading) {
    return null;
  }
  
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(i);
              }}
              className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium ${
                currentPage === i 
                  ? 'bg-purple-600 text-white border-purple-600' 
                  : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
              }`}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            isActive={currentPage === 1}
            onClick={(e) => { e.preventDefault(); onPageChange(1); }}
            className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium ${
              currentPage === 1 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
            }`}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis className="text-gray-400" />
          </PaginationItem>
        );
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => { e.preventDefault(); onPageChange(i); }}
              className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium ${
                currentPage === i 
                  ? 'bg-purple-600 text-white border-purple-600' 
                  : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
              }`}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis className="text-gray-400" />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            isActive={currentPage === totalPages}
            onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }}
            className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium ${
              currentPage === totalPages 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
            }`}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  return (
    <>
      <Pagination className="mb-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              className={`h-10 px-4 text-sm font-medium ${
                currentPage === 1 
                  ? 'pointer-events-none opacity-50 text-gray-500' 
                  : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
              }`}
            />
          </PaginationItem>
          {generatePaginationItems()}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              className={`h-10 px-4 text-sm font-medium ${
                currentPage === totalPages 
                  ? 'pointer-events-none opacity-50 text-gray-500' 
                  : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
              }`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <div className="text-center text-gray-400 text-sm mb-6">
        Page {currentPage} of {totalPages} ({totalItems} total items)
      </div>
    </>
  );
};

export default HomePagination;
