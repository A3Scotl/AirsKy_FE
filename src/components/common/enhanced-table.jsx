import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const EnhancedTable = ({
  data = [],
  columns = [],
  sortable = true,
  className = "",
  onRowClick,
  emptyMessage = "No data available",
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue
          .toLowerCase()
          .localeCompare(bValue.toLowerCase());
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        const comparison = aValue - bValue;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      // Default string comparison
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Get nested object value by key path (e.g., "user.name")
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Handle column sorting
  const handleSort = (columnKey) => {
    if (!sortable) return;

    setSortConfig((prevConfig) => ({
      key: columnKey,
      direction:
        prevConfig.key === columnKey && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Get sort icon for column
  const getSortIcon = (columnKey) => {
    if (!sortable || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.className || ""} ${
                  sortable && column.sortable !== false
                    ? "cursor-pointer hover:bg-gray-50 select-none"
                    : ""
                }`}
                onClick={() =>
                  sortable &&
                  column.sortable !== false &&
                  handleSort(column.key)
                }
              >
                <div className="flex items-center justify-between">
                  <span>{column.title}</span>
                  {sortable && column.sortable !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      {getSortIcon(column.key)}
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-gray-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, index) => (
              <TableRow
                key={row.id || index}
                className={`${
                  onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                }`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={column.cellClassName || ""}
                  >
                    {column.render
                      ? column.render(getNestedValue(row, column.key), row)
                      : getNestedValue(row, column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EnhancedTable;
