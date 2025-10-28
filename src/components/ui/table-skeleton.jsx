import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TableSkeleton = ({
  rows = 10,
  columns = 6,
  showHeader = true,
  className = "",
  headerTitles = [],
}) => {
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {headerTitles.length > 0
                ? headerTitles.map((title, index) => (
                    <TableHead key={index}>{title}</TableHead>
                  ))
                : Array.from({ length: columns }).map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full max-w-24" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableSkeleton;
