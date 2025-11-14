import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showFirstLast = true,
  showInfo = true,
  maxVisiblePages = 5,
  className = "",
}) => {
  // Calculate visible page range
  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("ellipsis-start");
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("ellipsis-end");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${className} mt-4`}>
      {/* Top section with page size selector and info */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-sm text-gray-600">
        {showInfo && (
          <div>
            Hiển thị {startItem} đến {endItem} trong tổng số {totalItems} kết
            quả
          </div>
        )}
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1">
            {/* Previous page button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              Trước
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1 mx-2">
              {visiblePages.map((page, index) => {
                if (page === "ellipsis-start" || page === "ellipsis-end") {
                  return (
                    <div
                      key={`ellipsis-${index}`}
                      className="h-8 w-8 flex items-center justify-center"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </div>
                  );
                }

                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className={`h-8 w-8 p-0 ${
                      page === currentPage
                        ? "bg-blue-700 text-white hover:bg-blue-700"
                        : ""
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            {/* Next page button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 px-3 bg-blue-white"
            >
              Sau
            </Button>
          </div>
        )}

        {/* Page info for mobile */}
        <div className="flex items-center justify-center text-sm text-gray-500 sm:hidden">
          Trang {currentPage} trên {totalPages}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
