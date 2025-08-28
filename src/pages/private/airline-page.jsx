import React, { useState, useEffect } from "react";
import AirlineModal from "@/components/admin/airlines/airline-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AirlinePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Thay bằng airlineApi.getAllAirlines()
    setLoading(true);
    setTimeout(() => {
      setAirlines([
        {
          airline_id: 1,
          airline_code: "VNA",
          airline_name: "Vietnam Airlines",
          contact: "19001100",
          is_active: true,
        },
        {
          airline_id: 2,
          airline_code: "BAM",
          airline_name: "Bamboo Airways",
          contact: "19001111",
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
  const handleEdit = (airline) => {
    setEditData(airline);
    setModalOpen(true);
  };
  const handleDelete = (airline) => {
    if (
      window.confirm(`Bạn có chắc muốn xóa hãng bay ${airline.airline_name}?`)
    ) {
      // TODO: Gọi API xóa
    }
  };
  const handleSubmit = (data) => {
    // TODO: Gọi API thêm/cập nhật
    setModalOpen(false);
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Hãng bay</h1>
        <Button onClick={handleAdd}>Thêm hãng bay</Button>
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
                <TableHead>Tên hãng bay</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {airlines.map((a) => (
                <TableRow key={a.airline_id}>
                  <TableCell className="font-mono">{a.airline_code}</TableCell>
                  <TableCell>{a.airline_name}</TableCell>
                  <TableCell>{a.contact}</TableCell>
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
      <AirlineModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editData}
      />
    </div>
  );
};

export default AirlinePage;
