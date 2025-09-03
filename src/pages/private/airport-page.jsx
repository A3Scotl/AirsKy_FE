import React, { useState, useEffect, useMemo } from "react";
import AirportModal from "@/components/admin/airport/airport-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Pencil, Search, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import { airportApi } from "@/apis/airport-api";
import { countryApi } from "@/apis/country-api";

const AirportPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [airports, setAirports] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("airportName");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách quốc gia
        const countryResponse = await countryApi.getAllCountries({
          size: 1000,
        });
        if (countryResponse.success) {
          setCountries(
            countryResponse.data.content || countryResponse.data || []
          );
        }

        // Lấy danh sách sân bay
        const airportResponse = await airportApi.getAllAirports({ size: 1000 });

        if (airportResponse.success) {
          const airportsData =
            airportResponse.data.content || airportResponse.data || [];
          console.log("Airports data from API:", airportsData);
          console.log(
            "Sample airport country fields:",
            airportsData.slice(0, 3).map((a) => ({
              name: a.airportName,
              country: a.country,
              countryName: a.countryName,
            }))
          );
          setAirports(airportsData);
        }
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get unique countries from airport data
  const uniqueCountries = useMemo(() => {
    const countrySet = new Set();
    airports.forEach((airport) => {
      const country = airport.country || airport.countryName;
      if (country && country.trim()) {
        countrySet.add(country.trim());
      }
    });
    const result = Array.from(countrySet).sort();
    console.log("Unique countries from airports:", result);
    return result;
  }, [airports]);

  // Filtered and sorted data
  const filteredAndSortedAirports = useMemo(() => {
    let filtered = airports;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (airport) =>
          airport.airportName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          airport.airportCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (airport.cityNames &&
            airport.cityNames
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (airport.cityName &&
            airport.cityName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((airport) =>
        statusFilter === "active" ? airport.active : !airport.active
      );
    }

    // Apply country filter
    if (countryFilter !== "all") {
      console.log("Filtering by country:", countryFilter);
      const beforeFilter = filtered.length;
      filtered = filtered.filter((airport) => {
        // So sánh với field country (string) - case insensitive
        const airportCountry = (
          airport.country ||
          airport.countryName ||
          ""
        ).trim();
        const filterValue = countryFilter.trim();
        const matches =
          airportCountry.toLowerCase() === filterValue.toLowerCase();

        if (matches) {
          console.log(
            "Match found:",
            airport.airportName,
            "->",
            airportCountry
          );
        }

        return matches;
      });
      console.log(
        `Country filter: ${beforeFilter} -> ${filtered.length} airports`
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "airportCode":
          aValue = a.airportCode || "";
          bValue = b.airportCode || "";
          break;
        case "airportName":
          aValue = a.airportName || "";
          bValue = b.airportName || "";
          break;
        case "city":
          const aCity = a.cityNames || a.cityName || a.city || "";
          const bCity = b.cityNames || b.cityName || b.city || "";
          aValue = aCity;
          bValue = bCity;
          break;
        default:
          aValue = a.airportName || "";
          bValue = b.airportName || "";
      }

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [airports, searchTerm, statusFilter, countryFilter, sortBy, sortOrder]);

  // Pagination logic
  const totalItems = filteredAndSortedAirports.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAirports = filteredAndSortedAirports.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, countryFilter, sortBy, sortOrder]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (airport) => {
    setEditData(airport);
    setModalOpen(true);
  };

  const handleDelete = async (airport) => {
    if (
      window.confirm(`Bạn có chắc muốn xóa sân bay ${airport.airportName}?`)
    ) {
      try {
        const response = await airportApi.deleteAirport(airport.airportId);
        if (response.success) {
          setAirports(
            airports.filter((a) => a.airportId !== airport.airportId)
          );
        } else {
          alert("Lỗi khi xóa: " + response.message);
        }
      } catch (error) {
        console.error("Lỗi xóa sân bay:", error);
        alert("Lỗi khi xóa sân bay");
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      let response;
      if (editData) {
        // Update
        response = await airportApi.updateAirport(editData.airportId, formData);
      } else {
        // Create
        response = await airportApi.createAirport(formData);
      }

      if (response.success) {
        setModalOpen(false);
        // Refresh danh sách (hoặc update local state)
        const airportResponse = await airportApi.getAllAirports({ size: 1000 });
        if (airportResponse.success) {
          setAirports(
            airportResponse.data.content || airportResponse.data || []
          );
        }
      } else {
        alert("Lỗi: " + response.message);
      }
    } catch (error) {
      console.error("Lỗi submit:", error);
      alert("Lỗi khi lưu sân bay");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Sân bay</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {totalItems} sân bay
          </p>
        </div>
        <Button onClick={handleAdd}>Thêm sân bay</Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên, mã hoặc thành phố..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Country Filter */}
          <div className="w-full lg:w-48">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo quốc gia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả quốc gia</SelectItem>
                {uniqueCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="w-full lg:w-48">
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="airportName-asc">Tên A-Z</SelectItem>
                <SelectItem value="airportName-desc">Tên Z-A</SelectItem>
                <SelectItem value="airportCode-asc">Mã A-Z</SelectItem>
                <SelectItem value="airportCode-desc">Mã Z-A</SelectItem>
                <SelectItem value="city-asc">Thành phố A-Z</SelectItem>
                <SelectItem value="city-desc">Thành phố Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("airportCode")}
                >
                  <div className="flex items-center gap-2">
                    Mã
                    {sortBy === "airportCode" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("airportName")}
                >
                  <div className="flex items-center gap-2">
                    Tên sân bay
                    {sortBy === "airportName" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("city")}
                >
                  <div className="flex items-center gap-2">
                    Thành phố
                    {sortBy === "city" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Ảnh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAirports.map((a) => (
                <TableRow key={a.airportId}>
                  <TableCell className="font-mono">{a.airportCode}</TableCell>
                  <TableCell>{a.airportName}</TableCell>
                  <TableCell>
                    {(() => {
                      console.log("Rendering airport:", a);
                      console.log(
                        "cityNames:",
                        a.cityNames,
                        "cityName:",
                        a.cityName,
                        "city:",
                        a.city
                      );
                      const cityData = a.cityNames || a.cityName || a.city;
                      console.log(
                        "Final cityData:",
                        cityData,
                        "Type:",
                        typeof cityData
                      );

                      // Xử lý trường hợp cityData là string
                      if (cityData && typeof cityData === "string") {
                        const cities = cityData.split(",");
                        console.log("Split cities:", cities);
                        return (
                          <div className="flex flex-wrap gap-1">
                            {cities.map((city, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {city.trim()}
                              </Badge>
                            ))}
                          </div>
                        );
                      }

                      // Xử lý trường hợp cityData là array
                      if (Array.isArray(cityData) && cityData.length > 0) {
                        console.log("City data is array:", cityData);
                        return (
                          <div className="flex flex-wrap gap-1">
                            {cityData.map((city, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {typeof city === "string" ? city.trim() : city}
                              </Badge>
                            ))}
                          </div>
                        );
                      }

                      return "-";
                    })()}
                  </TableCell>
                  <TableCell>{a.country}</TableCell>
                  <TableCell>
                    <img src={a.thumbnail} alt={a.airportName} className="w-12 h-12 object-cover rounded-sm" />
                  </TableCell>
                  <TableCell>
                    <span
                      className={a.active ? "text-green-600" : "text-gray-400"}
                    >
                      {a.active ? "Hoạt động" : "Ẩn"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(a)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(a)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          showPageSizeSelector={true}
          showInfo={true}
        />
      )}

      <AirportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editData}
        countries={countries}
      />
    </div>
  );
};

export default AirportPage;
