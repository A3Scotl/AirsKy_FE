import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Plane, Clock, ArrowRight } from "lucide-react";

const FavouritesTab = () => {
  const [favourites, setFavourites] = useState([
    {
      id: 1,
      flight: "VN7210",
      airline: "Vietnam Airlines",
      from: "Ho Chi Minh City",
      fromCode: "SGN",
      to: "Hanoi",
      toCode: "HAN",
      price: 60,
      duration: "2h 05m",
      departure: "08:30",
      arrival: "10:35",
      aircraft: "Airbus A321",
    },
    {
      id: 2,
      flight: "VN1234",
      airline: "Vietnam Airlines",
      from: "Hanoi",
      fromCode: "HAN",
      to: "Da Nang",
      toCode: "DAD",
      price: 80,
      duration: "1h 30m",
      departure: "14:20",
      arrival: "15:50",
      aircraft: "Boeing 737",
    },
    {
      id: 3,
      flight: "VN5678",
      airline: "Vietnam Airlines",
      from: "Ho Chi Minh City",
      fromCode: "SGN",
      to: "Phu Quoc",
      toCode: "PQC",
      price: 50,
      duration: "1h 00m",
      departure: "16:45",
      arrival: "17:45",
      aircraft: "ATR 72",
    },
    {
      id: 4,
      flight: "VN9012",
      airline: "Vietnam Airlines",
      from: "Da Nang",
      fromCode: "DAD",
      to: "Ho Chi Minh City",
      toCode: "SGN",
      price: 70,
      duration: "1h 20m",
      departure: "19:30",
      arrival: "20:50",
      aircraft: "Airbus A320",
    },
    {
      id: 5,
      flight: "VJ123",
      airline: "VietJet Air",
      from: "Hanoi",
      fromCode: "HAN",
      to: "Nha Trang",
      toCode: "CXR",
      price: 65,
      duration: "2h 15m",
      departure: "06:00",
      arrival: "08:15",
      aircraft: "Airbus A321",
    },
    {
      id: 6,
      flight: "QH456",
      airline: "Bamboo Airways",
      from: "Ho Chi Minh City",
      fromCode: "SGN",
      to: "Da Lat",
      toCode: "DLI",
      price: 55,
      duration: "1h 10m",
      departure: "11:15",
      arrival: "12:25",
      aircraft: "Embraer E190",
    },
  ]);

  const handleRemoveFavourite = (id) => {
    setFavourites(favourites.filter((fav) => fav.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chuyến bay yêu thích</CardTitle>
        <CardDescription>
          Các chuyến bay đã lưu của bạn để đặt nhanh
        </CardDescription>
      </CardHeader>
      <CardContent>
        {favourites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-2">
              Chưa có chuyến bay yêu thích
            </p>
            <p className="text-sm text-gray-500">
              Hãy thêm chuyến bay vào danh sách yêu thích để truy cập nhanh
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favourites.map((flight) => (
              <Card
                key={flight.id}
                className="relative hover:shadow-lg transition-shadow duration-200 hover:bg-blue-100/30 cursor-pointer"
              >
                {/* Remove Favourite Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10 h-8 w-8 p-0 hover:bg-red-100"
                  onClick={() => handleRemoveFavourite(flight.id)}
                >
                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                </Button>

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-blue-50 ">
                      {flight.flight}
                    </Badge>
                    <p className="text-xs text-gray-500">{flight.airline}</p>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Route Section */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{flight.fromCode}</p>
                      <p className="text-xs text-gray-500">{flight.from}</p>
                      <p className="text-sm font-medium">{flight.departure}</p>
                    </div>

                    <div className="flex flex-col items-center mx-4">
                      <div className="flex items-center">
                        <div className="h-0.5 w-8 bg-gray-300"></div>
                        <Plane className="h-4 w-4 text-blue-600 mx-1" />
                        <div className="h-0.5 w-8 bg-gray-300"></div>
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          {flight.duration}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-semibold">{flight.toCode}</p>
                      <p className="text-xs text-gray-500">{flight.to}</p>
                      <p className="text-sm font-medium">{flight.arrival}</p>
                    </div>
                  </div>

                  {/* Aircraft Info */}
                  <div className="text-center mb-4">
                    <p className="text-xs text-gray-500">{flight.aircraft}</p>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        ${flight.price}
                      </p>
                      <p className="text-xs text-gray-500">per person</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Đặt ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavouritesTab;
