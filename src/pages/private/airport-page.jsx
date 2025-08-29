import React, { useState, useEffect } from "react";
import AirportModal from "@/components/admin/airport/airport-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { flightApi } from "@/apis/flight-api";
import { Loader2, Trash2, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Giả lập API lấy danh sách quốc gia
const fetchCountries = async () => {
  // TODO: Thay bằng countryApi.getAllCountries nếu có
  return [
    { country_id: 1, country_name: "Việt Nam" },
    { country_id: 2, country_name: "Mỹ" },
  ];
};

const AirportPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [airports, setAirports] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountries().then(setCountries);
    // TODO: Thay bằng airportApi.getAllAirports()
    setLoading(true);
    setTimeout(() => {
      setAirports([
        {
          airport_id: 1,
          airport_code: "SGN",
          airport_name: "Tân Sơn Nhất",
          country_id: 1,
          is_active: true,
        },
        {
          airport_id: 2,
          airport_code: "HAN",
          airport_name: "Nội Bài",
          country_id: 1,
          is_active: false,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };
  const handleEdit = (airport) => {
    setEditData(airport);
    setModalOpen(true);
  };
  const handleDelete = (airport) => {
    // TODO: Gọi API xóa
    if (
      window.confirm(`Bạn có chắc muốn xóa sân bay ${airport.airport_name}?`)
    ) {
      // Xử lý xóa
    }
  };
  const handleSubmit = (data) => {
    // TODO: Gọi API thêm/cập nhật
    setModalOpen(false);
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Sân bay</h1>
        <Button onClick={handleAdd}>Thêm sân bay</Button>
      </div>
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên sân bay</TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {airports.map((a) => (
                <TableRow key={a.airport_id}>
                  <TableCell className="font-mono">{a.airport_code}</TableCell>
                  <TableCell>{a.airport_name}</TableCell>
                  <TableCell>
                    {countries.find((c) => c.country_id === a.country_id)
                      ?.country_name || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        a.is_active ? "text-green-600" : "text-gray-400"
                      }
                    >
                      {a.is_active ? "Hoạt động" : "Ẩn"}
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
