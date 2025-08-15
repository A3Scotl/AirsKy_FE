"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, MapPin, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const bookingDetails = {
    reference: "SKY789XYZ",
    outbound: {
      flightNumber: "SK401",
      departure: {
        airport: "John F. Kennedy (JFK)",
        city: "New York",
        date: "Dec 15, 2024",
        time: "08:30 AM",
        terminal: "Terminal 4",
      },
      arrival: {
        airport: "Los Angeles Intl (LAX)",
        city: "Los Angeles",
        date: "Dec 15, 2024",
        time: "12:15 PM",
        terminal: "Terminal 6",
      },
      duration: "5h 45m",
      class: "Economy",
      aircraft: "Boeing 787-9",
      gate: "B23",
    },
    return: {
      flightNumber: "SK402",
      departure: {
        airport: "Los Angeles Intl (LAX)",
        city: "Los Angeles",
        date: "Dec 20, 2024",
        time: "06:00 PM",
        terminal: "Terminal 6",
      },
      arrival: {
        airport: "John F. Kennedy (JFK)",
        city: "New York",
        date: "Dec 20, 2024",
        time: "10:20 PM",
        terminal: "Terminal 4",
      },
      duration: "4h 20m",
      class: "Economy",
      aircraft: "Airbus A350",
      gate: "C12",
    },
    passenger: {
      name: "John Doe",
      type: "Adult",
      seat: "12A (Outbound), 15C (Return)",
    },
    price: {
      total: 320,
      currency: "USD",
      breakdown: {
        baseFare: 280,
        taxesFees: 40,
      },
    },
    email: "john.doe@example.com",
  };

  const handleManageBooking = () => {
    navigate(`/manage-booking?reference=${bookingDetails.reference}`);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Failed to copy: ", err);
      return false;
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(bookingDetails.reference);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Confirmation Header */}
        <Card className="mb-6 text-center">
          <CardHeader>
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-[1.8rem] font-semibold">
              Booking Confirmed!
            </CardTitle>
            <CardDescription className="text-gray-600">
              You’re all set! Your flight has been successfully booked.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <p className="text-green-600 mb-2 bg-green-100 p-3 rounded-2xl inline-block">
              <span className="font-medium">Confirmation email sent to</span>{" "}
              <span className="underline">{bookingDetails.email}</span>
            </p>
          </CardContent>
        </Card>

        {/* Booking Reference */}
        <Card className="mb-6 flex flex-col justify-center items-center p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-lg font-semibold mb-4">
              Booking Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="border-2 w-full p-4 rounded-lg justify-center flex flex-col items-center">
            <div className="flex gap-2">
              <p className="text-lg font-semibold">
                {bookingDetails.reference}
              </p>
              <Button
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopy}
                className={
                  copied ? "bg-green-600 hover:bg-green-700 text-white" : ""
                }
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Save this reference number for future use
            </p>
          </CardContent>
        </Card>

        {/* Trip Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Trip Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Outbound Flight */}
            <div className="mb-4 p-4 border rounded-lg bg-white shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <MapPin className="mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold">
                    {bookingDetails.outbound.departure.city}
                  </p>
                  <p className="text-sm text-gray-600">
                    {bookingDetails.outbound.departure.airport}
                  </p>
                  <p className="text-sm">
                    {bookingDetails.outbound.departure.time},{" "}
                    {bookingDetails.outbound.departure.date}
                  </p>
                  <p className="text-xs text-gray-500">
                    Terminal: {bookingDetails.outbound.terminal}
                  </p>
                </div>

                <div className="text-center relative">
                  {/* Flight path line */}
                  <div className="hidden md:block absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
                    <div className="border-t-2 border-dashed border-blue-300 relative">
                      <div className="absolute left-0 top-0 w-2 h-2 bg-blue-600 rounded-full transform -translate-y-1/2"></div>
                      <div className="absolute right-0 top-0 w-2 h-2 bg-blue-600 rounded-full transform -translate-y-1/2"></div>
                    </div>
                  </div>

                  {/* Mobile plane icon */}

                  <div className="mt-8 md:mt-4">
                    <p className="font-semibold">
                      Flight {bookingDetails.outbound.flightNumber}
                    </p>
                    <p className="text-sm">
                      {bookingDetails.outbound.duration}
                    </p>
                    <p className="text-sm text-gray-600">
                      Aircraft: {bookingDetails.outbound.aircraft}
                    </p>
                    <p className="text-xs text-gray-500">
                      Gate: {bookingDetails.outbound.gate}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <MapPin className="mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold">
                    {bookingDetails.outbound.arrival.city}
                  </p>
                  <p className="text-sm text-gray-600">
                    {bookingDetails.outbound.arrival.airport}
                  </p>
                  <p className="text-sm">
                    {bookingDetails.outbound.arrival.time},{" "}
                    {bookingDetails.outbound.arrival.date}
                  </p>
                  <p className="text-xs text-gray-500">
                    Terminal: {bookingDetails.outbound.terminal}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {bookingDetails.outbound.class}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Passenger Info */}
            <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
              <p className="font-semibold">Passenger Information</p>
              <p>
                {bookingDetails.passenger.name} -{" "}
                {bookingDetails.passenger.type}
              </p>
              <p className="text-sm text-gray-600">
                Seat: {bookingDetails.passenger.seat}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Price Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Price Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>Base Fare</span>
                <span>${bookingDetails.price.breakdown.baseFare}</span>
              </p>
              <p className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>${bookingDetails.price.breakdown.taxesFees}</span>
              </p>
              <Separator />
              <p className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${bookingDetails.price.total}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What’s Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleManageBooking}
              >
                Manage Booking
              </Button>
              <Button variant="outline" className="w-full">
                Add to Calendar
              </Button>
              <Button variant="outline" className="w-full">
                Print Itinerary
              </Button>
              <Button variant="outline" className="w-full mt-2">
                Share Trip Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Reminders */}
        <Card className="bg-blue-100/50">
          <CardHeader>
            <CardTitle className="text-blue-600">Important Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-600 font-semibold">
              <li>✔ Check in 24 hours before departure</li>
              <li>✔ Arrive at airport 2 hours before flight</li>
              <li>✔ Ensure your ID/passport is valid for travel</li>
              <li>✔ Review baggage allowance and restrictions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirmation;
