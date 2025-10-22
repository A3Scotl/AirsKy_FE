import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FlightTableSkeleton = () => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hãng bay</TableHead>
            <TableHead>Máy bay</TableHead>
            <TableHead>Tuyến</TableHead>
            <TableHead>Lịch trình</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Tỷ lệ lấp đầy</TableHead>
            <TableHead>Cổng</TableHead>
            <TableHead>Điểm dừng</TableHead>
            <TableHead>Nhóm khứ hồi</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              {[...Array(7)].map((_, i) => (
                <TableCell key={i}>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FlightTableSkeleton;