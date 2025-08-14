"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Payment = () => {
  const [activeTab, setActiveTab] = useState("card");
  const [saveCard, setSaveCard] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const flightDetails = {
    outbound: {
      time: "9:15 AM",
      from: "New York (JFK)",
      to: "Los Angeles (LAX)",
      duration: "5h 45m",
      arrival: "3:00 PM",
      date: "March 15, 2024",
      airline: "American Airlines - Economy",
    },
    return: {
      time: "7:30 PM",
      from: "Los Angeles (LAX)",
      to: "New York (JFK)",
      duration: "5h 20m",
      arrival: "4:00 AM",
      date: "March 22, 2024",
      airline: "American Airlines - Economy",
    },
  };

  const passengers = [
    { name: "John Smith", type: "Adult" },
    { name: "Jane Smith", type: "Adult" },
  ];

  const selectedExtras = {
    seatSelection: "12A, 12B",
    extraBaggage: "2 x 23kg",
  };

  const priceBreakdown = {
    baseFare: 598.00,
    taxesFees: 80.00,
    seatSelection: 40.00,
    extraBaggage: 80.00,
    total: 798.00,
  };

  const handlePayment = () => {
    if (termsAccepted) {
      // Handle payment logic here
      alert("Payment processed successfully! Total: $" + priceBreakdown.total);
    } else {
      alert("Please accept the Terms and Conditions.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Review & Payment</h2>
      <p className="text-gray-600 mb-6">Please review your booking details and complete payment</p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Section: Flight and Passenger Details */}
        <div className="w-full md:w-1/2 space-y-6">
         

          <Card>
            <CardHeader>
              <CardTitle>Flight Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <p className="font-semibold">{flightDetails.outbound.time}</p>
                  <p>{flightDetails.outbound.from}</p>
                  <p className="text-sm text-gray-500">
                    {flightDetails.outbound.date} - {flightDetails.outbound.airline}
                  </p>
                </div>
                <div className="text-center">
                  <p>{flightDetails.outbound.duration}</p>
                  <p className="text-sm text-gray-500">Non-stop</p>
                  <p className="font-semibold">{flightDetails.outbound.arrival}</p>
                  <p>{flightDetails.outbound.to}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{flightDetails.return.time}</p>
                  <p>{flightDetails.return.from}</p>
                  <p className="text-sm text-gray-500">
                    {flightDetails.return.date} - {flightDetails.return.airline}
                  </p>
                </div>
                <div className="text-center">
                  <p>{flightDetails.return.duration}</p>
                  <p className="text-sm text-gray-500">Non-stop</p>
                  <p className="font-semibold">{flightDetails.return.arrival}</p>
                  <p>{flightDetails.return.to}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Passenger Information</CardTitle>
            </CardHeader>
            <CardContent>
              {passengers.map((passenger, index) => (
                <p key={index} className="mb-2">
                  {passenger.name} <span className="text-gray-500">({passenger.type})</span>
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Extras</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Seat Selection: {selectedExtras.seatSelection}</p>
              <p>Extra Baggage: {selectedExtras.extraBaggage}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Base Fare (2 passengers): ${priceBreakdown.baseFare.toFixed(2)}</p>
              <p>Taxes & Fees: ${priceBreakdown.taxesFees.toFixed(2)}</p>
              <p>Seat Selection: ${priceBreakdown.seatSelection.toFixed(2)}</p>
              <p>Extra Baggage: ${priceBreakdown.extraBaggage.toFixed(2)}</p>
              <p className="font-bold">Total: ${priceBreakdown.total.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Payment Method and Price Breakdown */}
        <div className="w-full md:w-1/2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="card">Card</TabsTrigger>
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                  <TabsTrigger value="googlepay">Google Pay</TabsTrigger>
                  <TabsTrigger value="applepay">Apple Pay</TabsTrigger>
                </TabsList>

                {/* Card Payment */}
                <TabsContent value="card">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 p-2 border rounded-md bg-blue-50 text-blue-600">
                        Card
                      </button>
                    </div>
                    <Input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Cardholder Name"
                        className="w-full"
                      />
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full"
                      />
                    </div>
                    <Input
                      type="text"
                      placeholder="CVV"
                      className="w-1/4"
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="save-card"
                        checked={saveCard}
                        onCheckedChange={setSaveCard}
                      />
                      <Label htmlFor="save-card">Save this card for future payments</Label>
                    </div>
                  </div>
                </TabsContent>

                {/* PayPal Payment */}
                <TabsContent value="paypal">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 p-2 border rounded-md bg-blue-500 text-white">
                        PayPal
                      </button>
                    </div>
                    <p className="text-gray-600">You will be redirected to PayPal to complete your payment.</p>
                    <Button className="w-full bg-blue-500 text-white">Continue with PayPal</Button>
                  </div>
                </TabsContent>

                {/* Google Pay Payment */}
                <TabsContent value="googlepay">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 p-2 border rounded-md bg-gray-800 text-white">
                        Google Pay
                      </button>
                    </div>
                    <p className="text-gray-600">Select your Google Pay account to proceed.</p>
                    <Button className="w-full bg-gray-800 text-white">Pay with Google Pay</Button>
                  </div>
                </TabsContent>

                {/* Apple Pay Payment */}
                <TabsContent value="applepay">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 p-2 border rounded-md bg-black text-white">
                        Apple Pay
                      </button>
                    </div>
                    <p className="text-gray-600">Use Apple Pay with your default card.</p>
                    <Button className="w-full bg-black text-white">Pay with Apple Pay</Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md flex items-center">
                <span className="mr-2">🛡️</span>
                <span>Secure Payment: Your payment information is encrypted and secure</span>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={setTermsAccepted}
                />
                <Label htmlFor="terms">I agree to the Terms and Conditions and Fare Rules</Label>
              </div>
              <Button
                className="w-full bg-blue-600 text-white mt-4"
                onClick={handlePayment}
                disabled={!termsAccepted}
              >
                Pay Now - ${priceBreakdown.total.toFixed(2)}
              </Button>
            </CardContent>
          </Card>

          
        </div>
      </div>
    </div>
  );
};

export default Payment;