import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plane,
  MapPin,
  Search,
  Home,
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Users,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SEO from "@/components/common/seo";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/flights?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const popularDestinations = [
    { code: "NYC", name: "New York", price: "$299" },
    { code: "LAX", name: "Los Angeles", price: "$199" },
    { code: "MIA", name: "Miami", price: "$259" },
    { code: "LAS", name: "Las Vegas", price: "$179" },
    { code: "CHI", name: "Chicago", price: "$219" },
    { code: "SEA", name: "Seattle", price: "$289" },
  ];

  const quickActions = [
    {
      icon: Search,
      title: "Search Flights",
      description: "Find your perfect flight",
      action: () => navigate("/flights"),
      color: "text-blue-600 bg-blue-100",
    },
    {
      icon: Calendar,
      title: "My Bookings",
      description: "View your reservations",
      action: () => navigate("/profile"),
      color: "text-green-600 bg-green-100",
    },
    {
      icon: Users,
      title: "Group Travel",
      description: "Book for multiple passengers",
      action: () => navigate("/flights"),
      color: "text-purple-600 bg-purple-100",
    },
    {
      icon: CreditCard,
      title: "Payment Options",
      description: "Flexible payment methods",
      action: () => navigate("/profile"),
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return (
    <>
      <SEO title="404 Not Found" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:from-gray-400 dark:via-gray-600 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Main 404 Section */}
          <div className="text-center mb-16">
            {/* Animated Plane */}
            <div className="relative mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-100 rounded-full mb-6">
                <Plane className="h-16 w-16 text-blue-600 transform rotate-45 animate-bounce" />
              </div>
            </div>

            {/* 404 Text */}
            <div className="mb-8">
              <h1 className="text-8xl font-bold text-gray-300 mb-4 dark:text-blue-600">
                404
              </h1>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-blue-500 mb-4">
                Oops! Flight Not Found
              </h2>
              <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto dark:text-gray-200">
                It looks like this page has taken off to another destination.
                Don't worry, we'll help you find your way back to amazing flight
                deals!
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:text-white"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>

          {/* Help Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-sky-50">
            <CardHeader className="text-center">
              <CardTitle className="dark:text-gray-800">
                Still Need Help?
              </CardTitle>
              <CardDescription>
                Our support team is here to assist you 24/7
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-blue-100 rounded-full mb-4">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2 dark:text-gray-800">
                    Call Us
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Speak with our travel experts
                  </p>
                  <Button variant="outline" size="sm">
                    1-800-FLY-NOW
                  </Button>
                </div>

                <div className="flex flex-col items-center">
                  <div className="p-4 bg-green-100 rounded-full mb-4">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2 dark:text-gray-800">
                    Email Support
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Get help via email
                  </p>
                  <Button variant="outline" size="sm">
                    support@airsky.com
                  </Button>
                </div>

                <div className="flex flex-col items-center">
                  <div className="p-4 bg-purple-100 rounded-full mb-4">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2 dark:text-gray-800">
                    Live Chat
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Chat with us instantly
                  </p>
                  <Button variant="outline" size="sm">
                    Start Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fun Facts */}
          <div className="mt-12 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  2.5M+
                </div>
                <p className="text-gray-600 dark:text-gray-200">
                  Happy Travelers
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  150+
                </div>
                <p className="text-gray-600 dark:text-gray-200">Destinations</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  24/7
                </div>
                <p className="text-gray-600 dark:text-gray-200">
                  Customer Support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
