import {
  Plane,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Award,
  Shield,
  Clock,
  Users,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="flex-shrink-0">
                <img
                  className="h-16 w-16 object-cover"
                  src="https://res.cloudinary.com/dzwjgfd7t/image/upload/v1755141382/flight%20booking/main_logo-removebg_xyofym.png"
                  alt="Workflow"
                />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AirSky
              </h2>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your trusted partner for seamless flight booking experiences.
              Discover the world with confidence, comfort, and unbeatable deals.
            </p>
          </div>

          {/* Main Footer Content */}
          <div className="grid md:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-6 text-white">
                About AirSky
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We revolutionize the way you travel by providing the most
                comprehensive flight booking platform. From budget-friendly
                options to luxury experiences, we make your journey
                unforgettable.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Mail className="w-5 h-5 mr-3 text-blue-400" />
                  <span>support@airsky.com</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Phone className="w-5 h-5 mr-3 text-blue-400" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                  <span>123 Aviation Blvd, Sky City, SC 12345</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Quick Tags</h3>
              <ul className="space-y-3">
                {[
                  "Flight Search",
                  "Travel Insurance",
                  "Group Booking",
                  "Corporate Travel",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">
                Customer Care
              </h3>
              <ul className="space-y-3">
                {[
                  "Help Center",
                  "Contact Support",
                  "Booking Management",
                  "Cancellation Policy",
                  "Refund Status",
                  "Travel Guidelines",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">
                Legal & Privacy
              </h3>
              <ul className="space-y-3">
                {[
                  "Terms of Service",
                  "Privacy Policy",
                  "Cookie Policy",
                  "Accessibility",
                  "Security Center",
                  "Compliance",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-700/50 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">
              Stay Updated with AirSky
            </h3>
            <p className="text-gray-300 mb-8">
              Subscribe to our newsletter and get exclusive deals, travel tips,
              and destination inspiration delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700/50 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center mb-4 lg:mb-0">
              <p className="text-gray-400">
                © 2025 AirSky Flight Booking. All rights reserved.
              </p>
            </div>

            {/* Social Media */}
            <div className="flex items-center space-x-6">
              <span className="text-gray-400 hidden sm:block">Follow us:</span>
              <div className="flex space-x-4">
                {[
                  { Icon: Facebook, color: "hover:text-blue-500" },
                  { Icon: Twitter, color: "hover:text-sky-400" },
                  { Icon: Instagram, color: "hover:text-pink-500" },
                  { Icon: Linkedin, color: "hover:text-blue-600" },
                ].map(({ Icon, color }, index) => (
                  <a
                    key={index}
                    href="#"
                    className={`text-gray-400 ${color} transition-all duration-200 hover:scale-110 transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
