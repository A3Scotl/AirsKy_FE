import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  Info,
  Calendar,
  DollarSign,
  Users,
  Plane,
  TrendingUp,
  MapPin,
} from "lucide-react";

const ReportTable = ({ type, dateRange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Available filter options for different report types
  const getFilterOptions = () => {
    const commonFilters = {
      status: [
        { value: "all", label: "All Status", count: 0 },
        { value: "confirmed", label: "Confirmed", count: 0 },
        { value: "pending", label: "Pending", count: 0 },
        { value: "cancelled", label: "Cancelled", count: 0 },
        { value: "completed", label: "Completed", count: 0 },
      ],
      dateRange: [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "week", label: "Last 7 Days" },
        { value: "month", label: "Last 30 Days" },
        { value: "quarter", label: "Last 3 Months" },
      ],
    };

    const typeSpecific = {
      bookings: {
        ...commonFilters,
        amount: {
          min: 0,
          max: 5000,
          step: 100,
          description: "Booking value range in USD (ticket price)",
        },
      },
      customers: {
        ...commonFilters,
        customerType: [
          { value: "all", label: "All Customer Types" },
          { value: "VIP", label: "VIP" },
          { value: "Premium", label: "Premium" },
          { value: "Standard", label: "Standard" },
          { value: "Basic", label: "Basic" },
        ],
        amount: {
          min: 0,
          max: 50000,
          step: 1000,
          description: "Total spending range in USD (lifetime value)",
        },
      },
      revenue: {
        ...commonFilters,
        amount: {
          min: 0,
          max: 200000,
          step: 5000,
          description: "Revenue range in USD (daily/monthly revenue)",
        },
      },
      flights: {
        ...commonFilters,
        amount: {
          min: 0,
          max: 100000,
          step: 2000,
          description: "Flight revenue range in USD (per flight)",
        },
      },
    };

    return typeSpecific[type] || commonFilters;
  };

  // Generate sample data based on report type
  const generateSampleData = () => {
    const data = [];
    const types = {
      overview: {
        headers: [
          "Date",
          "Revenue",
          "Bookings",
          "Customers",
          "Flights",
          "Success Rate",
        ],
        generateRow: (index) => ({
          id: index + 1,
          date: new Date(
            Date.now() - index * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US"),
          revenue: Math.floor(Math.random() * 100000) + 50000,
          bookings: Math.floor(Math.random() * 100) + 50,
          customers: Math.floor(Math.random() * 80) + 20,
          flights: Math.floor(Math.random() * 20) + 10,
          successRate: (Math.random() * 20 + 80).toFixed(1),
        }),
      },
      revenue: {
        headers: ["Date", "Revenue", "Cost", "Profit", "ROI", "Status"],
        generateRow: (index) => ({
          id: index + 1,
          date: new Date(
            Date.now() - index * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US"),
          revenue: Math.floor(Math.random() * 100000) + 50000,
          cost: Math.floor(Math.random() * 50000) + 20000,
          profit: 0,
          roi: 0,
          status:
            Math.random() > 0.8
              ? "low"
              : Math.random() > 0.3
              ? "normal"
              : "high",
        }),
      },
      bookings: {
        headers: [
          "Booking Code",
          "Customer",
          "Flight",
          "Booking Date",
          "Value",
          "Status",
        ],
        generateRow: (index) => ({
          id: `BK${String(index + 1).padStart(6, "0")}`,
          customerName: [
            "John Smith",
            "Emily Johnson",
            "Michael Brown",
            "Sarah Davis",
            "David Wilson",
          ][Math.floor(Math.random() * 5)],
          customerEmail: `customer${index + 1}@email.com`,
          customerPhone: `+1-${Math.floor(Math.random() * 900) + 100}-${
            Math.floor(Math.random() * 900) + 100
          }-${Math.floor(Math.random() * 9000) + 1000}`,
          flightCode: `AS${Math.floor(Math.random() * 900) + 100}`,
          flightRoute: [
            "NYC - LAX",
            "LAX - NYC",
            "NYC - MIA",
            "MIA - NYC",
            "LAX - MIA",
          ][Math.floor(Math.random() * 5)],
          bookingDate: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US"),
          departureTime: `${Math.floor(Math.random() * 12) + 6}:${String(
            Math.floor(Math.random() * 60)
          ).padStart(2, "0")} ${Math.random() > 0.5 ? "AM" : "PM"}`,
          value: Math.floor(Math.random() * 3000) + 200, // $200 - $3200
          paymentMethod: [
            "Credit Card",
            "Bank Transfer",
            "PayPal",
            "Apple Pay",
          ][Math.floor(Math.random() * 4)],
          status: ["confirmed", "pending", "cancelled", "completed"][
            Math.floor(Math.random() * 4)
          ],
          notes: `Booking note ${index + 1}`,
        }),
      },
      customers: {
        headers: [
          "Customer",
          "Email",
          "Bookings",
          "Total Spending",
          "Join Date",
          "Type",
        ],
        generateRow: (index) => ({
          id: index + 1,
          name: [
            "John Smith",
            "Emily Johnson",
            "Michael Brown",
            "Sarah Davis",
            "David Wilson",
          ][Math.floor(Math.random() * 5)],
          email: `customer${index + 1}@email.com`,
          bookingCount: Math.floor(Math.random() * 20) + 1,
          totalSpent: Math.floor(Math.random() * 25000) + 500, // $500 - $25,500
          joinDate: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US"),
          type: ["VIP", "Premium", "Standard", "Basic"][
            Math.floor(Math.random() * 4)
          ],
        }),
      },
      flights: {
        headers: [
          "Flight Code",
          "Route",
          "Date",
          "Revenue",
          "Passengers",
          "Status",
        ],
        generateRow: (index) => ({
          id: `AS${Math.floor(Math.random() * 900) + 100}`,
          route: [
            "NYC - LAX",
            "LAX - NYC",
            "NYC - MIA",
            "MIA - NYC",
            "LAX - MIA",
          ][Math.floor(Math.random() * 5)],
          date: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US"),
          revenue: Math.floor(Math.random() * 80000) + 20000, // $20,000 - $100,000
          passengers: Math.floor(Math.random() * 180) + 50,
          status: ["completed", "scheduled", "delayed", "cancelled"][
            Math.floor(Math.random() * 4)
          ],
        }),
      },
    };

    const currentType = types[type] || types.overview;

    for (let i = 0; i < 50; i++) {
      const row = currentType.generateRow(i);
      if (row.profit !== undefined && row.cost !== undefined) {
        row.profit = row.revenue - row.cost;
        row.roi = ((row.profit / row.cost) * 100).toFixed(1);
      }
      data.push(row);
    }
    return data;
  };

  const rawData = useMemo(() => generateSampleData(), [type]);

  // Filter and search data with enhanced filtering
  const filteredData = useMemo(() => {
    let filtered = rawData;

    // Status filter
    if (filterStatus !== "all" && filtered[0]?.status) {
      filtered = filtered.filter((row) => row.status === filterStatus);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filtered = filtered.filter((row) => {
        const amount = row.value || row.revenue || row.totalSpent || 0;
        const min = minAmount ? parseFloat(minAmount) : 0;
        const max = maxAmount ? parseFloat(maxAmount) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Date range filter
    if (filterDateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filterDateRange) {
        case "today":
          filterDate.setDate(now.getDate());
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "quarter":
          filterDate.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter((row) => {
        const rowDate = new Date(row.date || row.bookingDate || row.joinDate);
        return rowDate >= filterDate;
      });
    }

    return filtered;
  }, [rawData, filterStatus, minAmount, maxAmount, filterDateRange]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    return sorted;
  }, [filteredData, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Get headers based on type - English labels
  const getHeaders = () => {
    const headers = {
      overview: [
        "Date",
        "Revenue",
        "Bookings",
        "Customers",
        "Flights",
        "Success Rate",
      ],
      revenue: ["Date", "Revenue", "Cost", "Profit", "ROI", "Status"],
      bookings: [
        "Booking Code",
        "Customer",
        "Flight",
        "Booking Date",
        "Value",
        "Status",
      ],
      customers: [
        "Customer",
        "Email",
        "Bookings",
        "Total Spending",
        "Join Date",
        "Type",
      ],
      flights: [
        "Flight Code",
        "Route",
        "Date",
        "Revenue",
        "Passengers",
        "Status",
      ],
    };
    return headers[type] || headers.overview;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusLabels = {
      confirmed: "Confirmed",
      pending: "Pending",
      cancelled: "Cancelled",
      completed: "Completed",
      scheduled: "Scheduled",
      delayed: "Delayed",
      high: "High",
      normal: "Normal",
      low: "Low",
      VIP: "VIP",
      Premium: "Premium",
      Standard: "Standard",
      Basic: "Basic",
    };

    const variants = {
      confirmed: "default",
      pending: "secondary",
      cancelled: "destructive",
      completed: "default",
      scheduled: "secondary",
      delayed: "secondary",
      high: "default",
      normal: "secondary",
      low: "destructive",
      VIP: "default",
      Premium: "secondary",
      Standard: "outline",
      Basic: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const exportData = () => {
    const csv = [
      getHeaders().join(","),
      ...sortedData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Detail Modal Component
  const DetailModal = ({ row, onClose }) => {
    if (!row) return null;

    const getDetailFields = () => {
      switch (type) {
        case "bookings":
          return [
            { label: "Booking Code", value: row.id, icon: Calendar },
            { label: "Customer Name", value: row.customerName, icon: Users },
            { label: "Email", value: row.customerEmail },
            { label: "Phone Number", value: row.customerPhone },
            { label: "Flight Code", value: row.flightCode, icon: Plane },
            { label: "Route", value: row.flightRoute, icon: MapPin },
            { label: "Departure Time", value: row.departureTime },
            { label: "Booking Date", value: row.bookingDate },
            {
              label: "Value",
              value: formatCurrency(row.value),
              icon: DollarSign,
            },
            { label: "Payment Method", value: row.paymentMethod },
            { label: "Status", value: row.status },
            { label: "Notes", value: row.notes },
          ];
        case "customers":
          return [
            { label: "Customer Name", value: row.name, icon: Users },
            { label: "Email", value: row.email },
            { label: "Bookings Count", value: `${row.bookingCount} bookings` },
            {
              label: "Total Spending",
              value: formatCurrency(row.totalSpent),
              icon: DollarSign,
            },
            { label: "Join Date", value: row.joinDate },
            { label: "Customer Type", value: row.type },
          ];
        default:
          return Object.entries(row).map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value:
              typeof value === "number" && key.includes("revenue")
                ? formatCurrency(value)
                : value,
          }));
      }
    };

    return (
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {type === "bookings"
              ? "Booking Details"
              : type === "customers"
              ? "Customer Details"
              : "Report Details"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getDetailFields().map((field, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {field.icon && <field.icon className="h-4 w-4" />}
                  {field.label}
                </Label>
                <div className="text-sm font-medium bg-muted/50 p-2 rounded">
                  {field.label === "Status"
                    ? getStatusBadge(field.value)
                    : field.value || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize flex items-center gap-2">
              {type === "bookings" && <Calendar className="h-5 w-5" />}
              {type === "customers" && <Users className="h-5 w-5" />}
              {type === "flights" && <Plane className="h-5 w-5" />}
              {type === "revenue" && <DollarSign className="h-5 w-5" />}
              {type === "bookings"
                ? "Booking"
                : type === "customers"
                ? "Customer"
                : type === "flights"
                ? "Flight"
                : type === "revenue"
                ? "Revenue"
                : type}{" "}
              Report Details
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Filter by status, date range, and value range.{" "}
              {getFilterOptions().amount?.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Enhanced Filters - Removed Search */}
        <div className="space-y-4 mb-6">
          {/* Basic filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1" />
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="25">25 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-filter">Filter by Date</Label>
              <Select
                value={filterDateRange}
                onValueChange={setFilterDateRange}
              >
                <SelectTrigger id="date-filter">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min-amount">
                Min Value (USD)
                {getFilterOptions().amount && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Range: $0 - $
                    {getFilterOptions().amount.max.toLocaleString()}
                  </span>
                )}
              </Label>
              <Input
                id="min-amount"
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                min="0"
                max={getFilterOptions().amount?.max}
                step={getFilterOptions().amount?.step || 100}
              />
            </div>

            <div>
              <Label htmlFor="max-amount">
                Max Value (USD)
                {getFilterOptions().amount && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Suggested: ${getFilterOptions().amount.max.toLocaleString()}
                  </span>
                )}
              </Label>
              <Input
                id="max-amount"
                type="number"
                placeholder="No limit"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                min="0"
                max={getFilterOptions().amount?.max}
                step={getFilterOptions().amount?.step || 100}
              />
            </div>
          </div>

          {/* Filter summary */}
          {(filterStatus !== "all" ||
            filterDateRange !== "all" ||
            minAmount ||
            maxAmount) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters applied - Showing {filteredData.length} / {rawData.length}{" "}
              results
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterDateRange("all");
                  setMinAmount("");
                  setMaxAmount("");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {getHeaders().map((header) => (
                  <TableHead
                    key={header}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort(header.toLowerCase())}
                  >
                    <div className="flex items-center gap-2">
                      {header}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-[80px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow key={row.id || index} className="hover:bg-muted/50">
                  {getHeaders().map((header) => {
                    const key = header.toLowerCase().replace(/\s+/g, "");
                    let value = row[key] || row[header.toLowerCase()];

                    // Special formatting based on column type
                    if (
                      header.includes("Revenue") ||
                      header.includes("Cost") ||
                      header.includes("Profit") ||
                      header.includes("Value") ||
                      header.includes("Spending")
                    ) {
                      value = formatCurrency(value);
                    } else if (header === "ROI") {
                      value = `${value}%`;
                    } else if (header === "Success Rate") {
                      value = `${value}%`;
                    } else if (header === "Status" || header === "Type") {
                      return (
                        <TableCell key={header}>
                          {getStatusBadge(value)}
                        </TableCell>
                      );
                    } else if (header === "Customer") {
                      value = row.customerName || row.name;
                      return (
                        <TableCell key={header}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${value}`}
                              />
                              <AvatarFallback>
                                {value
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{value}</span>
                          </div>
                        </TableCell>
                      );
                    }

                    return <TableCell key={header}>{value}</TableCell>;
                  })}
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRow(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DetailModal row={selectedRow} />
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, sortedData.length)} of{" "}
            {sortedData.length} results
            {filteredData.length !== rawData.length && (
              <span className="text-blue-600">
                (filtered from {rawData.length} total)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTable;
