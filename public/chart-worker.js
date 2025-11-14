// Chart Worker for processing chart data in background
// Handles heavy calculations without blocking the main thread

// Revenue data processing
function processRevenueData(data) {
  try {
    const { bookings, period = "30days" } = data;

    // Group bookings by date
    const revenueByDate = {};
    const bookingCountByDate = {};

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt).toISOString().split("T")[0];

      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
        bookingCountByDate[date] = 0;
      }

      revenueByDate[date] += booking.totalPrice || 0;
      bookingCountByDate[date] += 1;
    });

    // Convert to chart format
    const labels = Object.keys(revenueByDate).sort();
    const revenueData = labels.map((date) => revenueByDate[date]);
    const bookingData = labels.map((date) => bookingCountByDate[date]);

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenueData,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
        },
        {
          label: "Bookings",
          data: bookingData,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.1,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Revenue data processing failed: ${error.message}`);
  }
}

// Booking statistics processing
function processBookingStats(data) {
  try {
    const { bookings } = data;

    // Status distribution
    const statusCounts = {};
    const classCounts = {};
    const monthlyBookings = {};

    bookings.forEach((booking) => {
      // Status count
      const status = booking.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Class count
      const travelClass = booking.travelClass || "economy";
      classCounts[travelClass] = (classCounts[travelClass] || 0) + 1;

      // Monthly bookings
      const month = new Date(booking.createdAt).toISOString().slice(0, 7);
      monthlyBookings[month] = (monthlyBookings[month] || 0) + 1;
    });

    return {
      statusDistribution: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            label: "Bookings by Status",
            data: Object.values(statusCounts),
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 205, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
            ],
          },
        ],
      },
      classDistribution: {
        labels: Object.keys(classCounts),
        datasets: [
          {
            label: "Bookings by Class",
            data: Object.values(classCounts),
            backgroundColor: [
              "rgba(255, 159, 64, 0.8)",
              "rgba(199, 199, 199, 0.8)",
              "rgba(83, 102, 255, 0.8)",
            ],
          },
        ],
      },
      monthlyTrend: {
        labels: Object.keys(monthlyBookings).sort(),
        datasets: [
          {
            label: "Monthly Bookings",
            data: Object.keys(monthlyBookings)
              .sort()
              .map((month) => monthlyBookings[month]),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.1,
          },
        ],
      },
    };
  } catch (error) {
    throw new Error(`Booking stats processing failed: ${error.message}`);
  }
}

// Flight statistics processing
function processFlightStats(data) {
  try {
    const { flights } = data;

    // Airline distribution
    const airlineCounts = {};
    // Route analysis
    const routeCounts = {};
    // Status distribution
    const statusCounts = {};

    flights.forEach((flight) => {
      // Airline count
      const airline = flight.airline?.name || "Unknown";
      airlineCounts[airline] = (airlineCounts[airline] || 0) + 1;

      // Route count
      const route = `${flight.departureAirport?.code || "UNK"} - ${
        flight.arrivalAirport?.code || "UNK"
      }`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;

      // Status count
      const status = flight.status || "scheduled";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      airlineDistribution: {
        labels: Object.keys(airlineCounts),
        datasets: [
          {
            label: "Flights by Airline",
            data: Object.values(airlineCounts),
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 205, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
              "rgba(255, 159, 64, 0.8)",
            ],
          },
        ],
      },
      routeDistribution: {
        labels: Object.keys(routeCounts).slice(0, 10), // Top 10 routes
        datasets: [
          {
            label: "Top Routes",
            data: Object.values(routeCounts).slice(0, 10),
            backgroundColor: "rgba(75, 192, 192, 0.8)",
          },
        ],
      },
      statusDistribution: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            label: "Flight Status",
            data: Object.values(statusCounts),
            backgroundColor: [
              "rgba(75, 192, 192, 0.8)",
              "rgba(255, 205, 86, 0.8)",
              "rgba(255, 99, 132, 0.8)",
              "rgba(201, 203, 207, 0.8)",
            ],
          },
        ],
      },
    };
  } catch (error) {
    throw new Error(`Flight stats processing failed: ${error.message}`);
  }
}

// Customer statistics processing
function processCustomerStats(data) {
  try {
    const { users } = data;

    // Registration trends
    const monthlyRegistrations = {};
    // Status distribution
    const statusCounts = {};
    // Role distribution
    const roleCounts = {};

    users.forEach((user) => {
      // Monthly registrations
      const month = new Date(user.createdAt).toISOString().slice(0, 7);
      monthlyRegistrations[month] = (monthlyRegistrations[month] || 0) + 1;

      // Status count
      const status = user.status || "active";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Role count
      const role = user.role || "user";
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    return {
      registrationTrend: {
        labels: Object.keys(monthlyRegistrations).sort(),
        datasets: [
          {
            label: "Monthly Registrations",
            data: Object.keys(monthlyRegistrations)
              .sort()
              .map((month) => monthlyRegistrations[month]),
            borderColor: "rgb(153, 102, 255)",
            backgroundColor: "rgba(153, 102, 255, 0.2)",
            tension: 0.1,
          },
        ],
      },
      statusDistribution: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            label: "Users by Status",
            data: Object.values(statusCounts),
            backgroundColor: [
              "rgba(75, 192, 192, 0.8)",
              "rgba(255, 99, 132, 0.8)",
              "rgba(255, 205, 86, 0.8)",
              "rgba(201, 203, 207, 0.8)",
            ],
          },
        ],
      },
      roleDistribution: {
        labels: Object.keys(roleCounts),
        datasets: [
          {
            label: "Users by Role",
            data: Object.values(roleCounts),
            backgroundColor: [
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 159, 64, 0.8)",
              "rgba(153, 102, 255, 0.8)",
            ],
          },
        ],
      },
    };
  } catch (error) {
    throw new Error(`Customer stats processing failed: ${error.message}`);
  }
}

// Process all statistics at once
function processAllStats(data) {
  try {
    const { bookings = [], flights = [], users = [] } = data;

    const results = {};

    if (bookings.length > 0) {
      results.bookings = processBookingStats({ bookings });
      results.revenue = processRevenueData({ bookings });
    }

    if (flights.length > 0) {
      results.flights = processFlightStats({ flights });
    }

    if (users.length > 0) {
      results.customers = processCustomerStats({ users });
    }

    return results;
  } catch (error) {
    throw new Error(`All stats processing failed: ${error.message}`);
  }
}

// Message handler
self.onmessage = function (e) {
  const { type, data, requestId } = e.data;

  try {
    let result;

    switch (type) {
      case "processRevenueData":
        result = processRevenueData(data);
        break;
      case "processBookingStats":
        result = processBookingStats(data);
        break;
      case "processFlightStats":
        result = processFlightStats(data);
        break;
      case "processCustomerStats":
        result = processCustomerStats(data);
        break;
      case "processAllStats":
        result = processAllStats(data);
        break;
      default:
        throw new Error(`Unknown processing type: ${type}`);
    }

    // Send success response
    self.postMessage({
      success: true,
      type,
      result,
      requestId,
    });
  } catch (error) {
    console.error("Chart worker error:", error);

    // Send error response
    self.postMessage({
      success: false,
      type,
      error: error.message,
      requestId,
    });
  }
};

// Handle worker termination
self.onbeforeunload = function () {
  console.log("Chart worker terminated");
};
