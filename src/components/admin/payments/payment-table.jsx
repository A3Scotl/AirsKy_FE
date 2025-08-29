import { useState, useMemo } from "react";
import {
  MoreHorizontal,
  Eye,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PaymentTable = ({
  searchTerm,
  statusFilter,
  methodFilter,
  dateRange,
  onViewDetails,
  onRefund,
  limit,
  showActions = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(limit || 10);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Mock payment data
  const mockPayments = [
    {
      id: "PAY001",
      transactionId: "TXN_2024_001547",
      customerName: "John Smith",
      customerEmail: "john.smith@email.com",
      bookingReference: "AS789XYZ",
      amount: 450.0,
      currency: "USD",
      method: "credit_card",
      methodDetails: "•••• 4242",
      status: "completed",
      date: "2024-08-15T10:30:00Z",
      processingTime: "2.3s",
      fees: 13.5,
      netAmount: 436.5,
      gatewayReference: "ch_1PqB2LGswQQnYKxY7Bb4vU2L",
      country: "United States",
      riskScore: "low",
    },
    {
      id: "PAY002",
      transactionId: "TXN_2024_001548",
      customerName: "Emma Johnson",
      customerEmail: "emma.j@email.com",
      bookingReference: "AS790ABC",
      amount: 720.5,
      currency: "USD",
      method: "paypal",
      methodDetails: "PayPal Account",
      status: "pending",
      date: "2024-08-15T09:45:00Z",
      processingTime: "pending",
      fees: 21.62,
      netAmount: 698.88,
      gatewayReference: "PAYID-ABC123XYZ",
      country: "Canada",
      riskScore: "medium",
    },
    {
      id: "PAY003",
      transactionId: "TXN_2024_001549",
      customerName: "Michael Brown",
      customerEmail: "m.brown@email.com",
      bookingReference: "AS791DEF",
      amount: 320.75,
      currency: "USD",
      method: "apple_pay",
      methodDetails: "Apple Pay",
      status: "failed",
      date: "2024-08-15T08:20:00Z",
      processingTime: "failed",
      fees: 0,
      netAmount: 0,
      gatewayReference: "ap_failed_xyz789",
      country: "United Kingdom",
      riskScore: "high",
    },
    {
      id: "PAY004",
      transactionId: "TXN_2024_001550",
      customerName: "Sarah Davis",
      customerEmail: "sarah.davis@email.com",
      bookingReference: "AS792GHI",
      amount: 1250.0,
      currency: "USD",
      method: "credit_card",
      methodDetails: "•••• 1234",
      status: "refunded",
      date: "2024-08-14T16:15:00Z",
      processingTime: "1.8s",
      fees: 37.5,
      netAmount: 1212.5,
      gatewayReference: "ch_refund_abc123",
      country: "Australia",
      riskScore: "low",
    },
    {
      id: "PAY005",
      transactionId: "TXN_2024_001551",
      customerName: "David Wilson",
      customerEmail: "d.wilson@email.com",
      bookingReference: "AS793JKL",
      amount: 890.25,
      currency: "USD",
      method: "google_pay",
      methodDetails: "Google Pay",
      status: "completed",
      date: "2024-08-14T14:30:00Z",
      processingTime: "1.2s",
      fees: 26.71,
      netAmount: 863.54,
      gatewayReference: "gp_success_def456",
      country: "Germany",
      riskScore: "low",
    },
    {
      id: "PAY006",
      transactionId: "TXN_2024_001552",
      customerName: "Lisa Anderson",
      customerEmail: "lisa.anderson@email.com",
      bookingReference: "AS794MNO",
      amount: 675.8,
      currency: "USD",
      method: "debit_card",
      methodDetails: "•••• 5678",
      status: "completed",
      date: "2024-08-14T12:45:00Z",
      processingTime: "3.1s",
      fees: 20.27,
      netAmount: 655.53,
      gatewayReference: "ch_debit_ghi789",
      country: "France",
      riskScore: "low",
    },
    {
      id: "PAY007",
      transactionId: "TXN_2024_001553",
      customerName: "Robert Taylor",
      customerEmail: "r.taylor@email.com",
      bookingReference: "AS795PQR",
      amount: 1420.0,
      currency: "USD",
      method: "bank_transfer",
      methodDetails: "Bank Transfer",
      status: "pending",
      date: "2024-08-14T11:20:00Z",
      processingTime: "pending",
      fees: 42.6,
      netAmount: 1377.4,
      gatewayReference: "bt_pending_jkl012",
      country: "Japan",
      riskScore: "low",
    },
    {
      id: "PAY008",
      transactionId: "TXN_2024_001554",
      customerName: "Jennifer White",
      customerEmail: "j.white@email.com",
      bookingReference: "AS796STU",
      amount: 540.6,
      currency: "USD",
      method: "credit_card",
      methodDetails: "•••• 9876",
      status: "cancelled",
      date: "2024-08-14T09:10:00Z",
      processingTime: "cancelled",
      fees: 0,
      netAmount: 0,
      gatewayReference: "ch_cancelled_mno345",
      country: "Singapore",
      riskScore: "medium",
    },
  ];

  // Filter and sort data
  const filteredPayments = useMemo(() => {
    let filtered = mockPayments.filter((payment) => {
      const matchesSearch =
        !searchTerm ||
        payment.transactionId
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customerEmail
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payment.bookingReference
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      const matchesMethod =
        methodFilter === "all" || payment.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortField === "amount") {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [
    mockPayments,
    searchTerm,
    statusFilter,
    methodFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPayments = filteredPayments.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getMethodIcon = (method) => {
    const icons = {
      credit_card: "💳",
      debit_card: "💳",
      paypal: "🅿️",
      apple_pay: "🍎",
      google_pay: "🔵",
      bank_transfer: "🏦",
    };
    return icons[method] || "💳";
  };

  const getRiskScoreColor = (score) => {
    const colors = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-red-600",
    };
    return colors[score] || "text-gray-600";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      {!limit && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">entries</span>
          </div>

          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + pageSize, filteredPayments.length)} of{" "}
            {filteredPayments.length} entries
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("transactionId")}
              >
                Transaction ID
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("customerName")}
              >
                Customer
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("amount")}
              >
                Amount
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("method")}
              >
                Method
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("status")}
              >
                Status
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("date")}
              >
                Date
              </TableHead>
              <TableHead>Country</TableHead>
              
              {showActions && (
                <TableHead className="text-center">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-sm">
                  <div>
                    <div className="font-medium">{payment.transactionId}</div>
                    <div className="text-xs text-gray-500">
                      {payment.bookingReference}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {payment.customerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {payment.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.customerEmail}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <div className="font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    {payment.fees > 0 && (
                      <div className="text-xs text-gray-500">
                        Fee: {formatCurrency(payment.fees)}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {getMethodIcon(payment.method)}
                    </span>
                    <div>
                      <div className="text-sm font-medium capitalize">
                        {payment.method.replace("_", " ")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.methodDetails}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status.charAt(0).toUpperCase() +
                      payment.status.slice(1)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="text-sm">
                    <div>{formatDate(payment.date)}</div>
                    {payment.processingTime !== "pending" &&
                      payment.processingTime !== "failed" &&
                      payment.processingTime !== "cancelled" && (
                        <div className="text-xs text-gray-500">
                          {payment.processingTime}
                        </div>
                      )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm">{payment.country}</span>
                </TableCell>

                

                {showActions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onViewDetails(payment)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download Receipt
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {payment.status === "completed" && (
                          <DropdownMenuItem
                            onClick={() => onRefund(payment)}
                            className="text-red-600"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Process Refund
                          </DropdownMenuItem>
                        )}
                        {payment.status === "pending" && (
                          <>
                            <DropdownMenuItem className="text-green-600">
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Decline
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!limit && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTable;
