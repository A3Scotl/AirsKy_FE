import { useState, useEffect, useCallback } from "react";
import { flightApi } from "../apis/flight-api";
import { airportApi } from "../apis/airport-api";

// Custom hooks for flight search functionality

const useFlightData = (searchCriteria) => {
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFlights = useCallback(async (criteria) => {
    let isRoundTripSearch = false; // Declare at function scope
    try {
      setLoading(true);
      setError(null); // Clear previous error
      let response;

      console.log("🚀 ========== STARTING FLIGHT SEARCH ==========");
      console.log(
        "🔍 RESULT PAGE: useFlightData fetchFlights called with criteria:",
        criteria
      );

      if (criteria) {
        console.log("📊 DETAILED CRITERIA ANALYSIS:", {
          hasCriteria: !!criteria,
          tripType: criteria.tripType,
          from: criteria.from,
          to: criteria.to,
          fromType: typeof criteria.from,
          toType: typeof criteria.to,
          departDate: criteria.departDate,
          returnDate: criteria.returnDate,
          departDateType: typeof criteria.departDate,
          returnDateType: typeof criteria.returnDate,
          passengers: criteria.passengers,
          searchCombinations: criteria.searchCombinations,
        });
      }

      // If no criteria provided, show popular flights or empty state
      if (!criteria) {
        console.log("📋 No search criteria - showing popular flights");
        console.log("🔥 API: getAllFlights (popular flights)");
        console.log("📤 Sending popular flights to result section...");
        response = await flightApi.getAllFlights({ size: 200 }); // Increased from 20 to 200 for more results
      } else {
        console.log("📊 Processing search criteria:", {
          tripType: criteria.tripType,
          from: criteria.from,
          to: criteria.to,
          departDate: criteria.departDate,
          returnDate: criteria.returnDate,
        });

        // Check if we have minimum required criteria
        const hasBasicInfo = criteria.from && criteria.to;
        const isCountrySearchEarly =
          typeof criteria.from === "string" &&
          typeof criteria.to === "string" &&
          !criteria.from.includes("(") && // Not airport format
          !criteria.to.includes("("); // Not airport format
        const hasValidDate =
          criteria.departDate && !isNaN(criteria.departDate.getTime());

        if (!hasBasicInfo || (!hasValidDate && !isCountrySearchEarly)) {
          console.log("❌ Missing required search criteria:", {
            hasBasicInfo,
            hasValidDate,
            isCountrySearch: isCountrySearchEarly,
            from: !!criteria.from,
            to: !!criteria.to,
            departDate: criteria.departDate,
            departDateValid:
              criteria.departDate && !isNaN(criteria.departDate.getTime()),
          });
          console.log(
            "📤 Sending empty results to result section (invalid criteria)..."
          );
          setAllFlights([]);
          setError(
            "Vui lòng nhập đầy đủ thông tin: điểm khởi hành, điểm đến và ngày khởi hành"
          );
          setLoading(false);
          return;
        }

        // Extract airport IDs from search criteria
        const extractAirportId = async (location) => {
          if (!location) return null;

          console.log(
            "🎯 extractAirportId input:",
            location,
            "type:",
            typeof location,
            "keys:",
            typeof location === "object" ? Object.keys(location) : "N/A",
            "full object:",
            JSON.stringify(location, null, 2)
          );

          // If it's an object with airportId (numeric ID)
          if (typeof location === "object" && location.airportId) {
            const id = location.airportId;
            console.log("🎯 Found airportId property:", id, "type:", typeof id);
            // Ensure it's numeric
            if (typeof id === "number" || !isNaN(Number(id))) {
              console.log("🎯 Returning valid airportId:", Number(id));
              return Number(id);
            } else {
              console.log("❌ airportId is not numeric:", id);
            }
          } else if (typeof location === "object") {
            console.log("❌ Object doesn't have airportId property");
            console.log("🔍 DEBUG: Object properties available:", {
              allKeys: Object.keys(location),
              allValues: Object.values(location),
              fullObject: JSON.stringify(location, null, 2),
              hasId: "id" in location,
              hasAirportId: "airportId" in location,
              hasAirportCode: "airportCode" in location,
              hasCity: "city" in location,
              hasDisplayName: "displayName" in location,
              idValue: location.id,
              airportIdValue: location.airportId,
              airportCodeValue: location.airportCode,
              cityValue: location.city,
              displayNameValue: location.displayName,
            });
          }

          // If it's an object with airportCode (string code)
          if (typeof location === "object" && location.airportCode) {
            const code = location.airportCode;
            console.log(
              "🎯 Found airportCode property:",
              code,
              "type:",
              typeof code
            );
            // Convert airport code to airport ID directly via API
            try {
              const apiResponse = await airportApi.getAirportByCode(code);
              console.log(
                "🔄 getAirportByCode result for",
                code,
                ":",
                apiResponse
              );
              if (
                apiResponse.success &&
                apiResponse.data &&
                apiResponse.data.airportId
              ) {
                console.log(
                  "🎯 Successfully converted airportCode to airportId:",
                  apiResponse.data.airportId
                );
                return apiResponse.data.airportId;
              } else {
                console.log(
                  "❌ Failed to convert airportCode to airportId:",
                  code,
                  "API Response:",
                  apiResponse
                );
                return null;
              }
            } catch (error) {
              console.error(
                "❌ Error calling getAirportByCode for",
                code,
                ":",
                error
              );
              return null;
            }
          }

          // If it's an object with id (numeric ID)
          if (typeof location === "object" && location.id) {
            const id = location.id;
            console.log("🎯 Found id property:", id, "type:", typeof id);
            // Ensure it's numeric
            if (typeof id === "number" || !isNaN(Number(id))) {
              console.log("🎯 Returning valid id:", Number(id));
              return Number(id);
            } else {
              console.log("❌ id is not numeric:", id);
            }
          }

          // If it's a string that looks like a JSON object, try to parse it
          if (typeof location === "string") {
            // First, try to extract airport code from format "City (CODE)"
            const match = location.match(/\(([^)]+)\)$/);
            if (match) {
              const airportCode = match[1];
              console.log(
                "🎯 Extracted airport code from string:",
                airportCode
              );
              try {
                const apiResponse = await airportApi.getAirportByCode(
                  airportCode
                );
                console.log(
                  "🔄 getAirportByCode result for",
                  airportCode,
                  ":",
                  apiResponse
                );
                if (
                  apiResponse.success &&
                  apiResponse.data &&
                  apiResponse.data.airportId
                ) {
                  console.log(
                    "🎯 Successfully converted extracted code to airportId:",
                    apiResponse.data.airportId
                  );
                  return apiResponse.data.airportId;
                } else {
                  console.log(
                    "❌ Failed to convert extracted airportCode:",
                    airportCode
                  );
                }
              } catch (error) {
                console.error(
                  "❌ Error calling getAirportByCode for",
                  airportCode,
                  ":",
                  error
                );
              }
            }

            try {
              const parsedLocation = JSON.parse(location);
              console.log("🎯 Parsed JSON string to object:", parsedLocation);
              console.log(
                "🎯 Object has airportCode:",
                parsedLocation.airportCode
              );
              // Recursively call with parsed object
              return await extractAirportId(parsedLocation);
            } catch (error) {
              console.log(
                "❌ String is not JSON and cannot be used for airport ID:",
                location
              );
            }
          }

          // If we can't find a valid numeric airport ID, return null
          console.error(
            "❌ Could not find valid numeric airport ID from:",
            location
          );
          return null;
        };

        // Check if we have multiple search combinations (more than 1)
        const hasMultipleCombinations =
          criteria.searchCombinations && criteria.searchCombinations.length > 1;

        if (hasMultipleCombinations) {
          console.log(
            "🔄 MULTIPLE COMBINATIONS DETECTED:",
            criteria.searchCombinations.length,
            "combinations"
          );

          // Process multiple combinations
          const allFlightsResults = [];
          const errors = [];

          for (const combination of criteria.searchCombinations) {
            try {
              console.log("🔄 Processing combination:", combination);

              // Extract airport IDs for this combination
              const departureAirportId = await extractAirportId(
                combination.from
              );
              const arrivalAirportId = await extractAirportId(combination.to);

              if (!departureAirportId || !arrivalAirportId) {
                console.warn(
                  "⚠️ Skipping combination due to invalid airport IDs:",
                  {
                    from: combination.from,
                    to: combination.to,
                    departureAirportId,
                    arrivalAirportId,
                  }
                );
                continue;
              }

              // Determine API call for this combination
              const hasReturnDate =
                criteria.returnDate && !isNaN(criteria.returnDate.getTime());
              const hasDepartureDate =
                criteria.departDate && !isNaN(criteria.departDate.getTime());

              let combinationResponse;

              if (hasReturnDate && hasDepartureDate) {
                // Round trip
                const roundTripParams = {
                  departureAirportId: departureAirportId,
                  arrivalAirportId: arrivalAirportId,
                  outboundDate: criteria.departDate
                    ? (() => {
                        const localDate = new Date(criteria.departDate);
                        const year = localDate.getFullYear();
                        const month = String(localDate.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(localDate.getDate()).padStart(
                          2,
                          "0"
                        );
                        return `${year}-${month}-${day}`;
                      })()
                    : null,
                  returnDate: criteria.returnDate
                    ? (() => {
                        const localDate = new Date(criteria.returnDate);
                        const year = localDate.getFullYear();
                        const month = String(localDate.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(localDate.getDate()).padStart(
                          2,
                          "0"
                        );
                        return `${year}-${month}-${day}`;
                      })()
                    : null,
                  page: 0,
                  size: 100, // Increased from 50 to get more results
                };

                console.log(
                  "🔄 ROUND TRIP API for combination:",
                  combination.from.airportCode,
                  "→",
                  combination.to.airportCode
                );
                combinationResponse = await flightApi.searchRoundTripFlights(
                  roundTripParams
                );
              } else {
                // One way
                const oneWayParams = {
                  departureAirportId: departureAirportId,
                  arrivalAirportId: arrivalAirportId,
                  date: criteria.departDate
                    ? (() => {
                        const localDate = new Date(criteria.departDate);
                        const year = localDate.getFullYear();
                        const month = String(localDate.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(localDate.getDate()).padStart(
                          2,
                          "0"
                        );
                        return `${year}-${month}-${day}`;
                      })()
                    : null,
                  page: 0,
                  size: 100, // Increased from 50 to get more results
                };

                console.log(
                  "➡️ ONE WAY API for combination:",
                  combination.from.airportCode,
                  "→",
                  combination.to.airportCode
                );
                combinationResponse = await flightApi.searchOneWayFlights(
                  oneWayParams
                );
              }

              if (combinationResponse.success && combinationResponse.data) {
                let flightsData = [];
                if (Array.isArray(combinationResponse.data)) {
                  flightsData = combinationResponse.data;
                } else if (
                  combinationResponse.data &&
                  Array.isArray(combinationResponse.data.content)
                ) {
                  flightsData = combinationResponse.data.content;
                } else if (
                  combinationResponse.data &&
                  typeof combinationResponse.data === "object"
                ) {
                  flightsData = [combinationResponse.data];
                }

                // Add combination info to each flight
                const flightsWithCombination = flightsData.map((flight) => ({
                  ...flight,
                  id: flight.flightId,
                  priceNumeric: flight.basePrice || 0,
                  combination: {
                    from: combination.from,
                    to: combination.to,
                    route: `${combination.from.airportCode} → ${combination.to.airportCode}`,
                  },
                }));

                allFlightsResults.push(...flightsWithCombination);
                console.log(
                  `✅ Found ${flightsWithCombination.length} flights for ${combination.from.airportCode} → ${combination.to.airportCode}`
                );
              } else {
                console.warn(
                  `⚠️ No flights found for ${combination.from.airportCode} → ${combination.to.airportCode}`
                );
              }
            } catch (error) {
              console.error(
                `❌ Error processing combination ${combination.from?.airportCode} → ${combination.to?.airportCode}:`,
                error
              );
              errors.push(
                `Lỗi tìm kiếm ${combination.from?.airportCode} → ${combination.to?.airportCode}: ${error.message}`
              );
            }
          }

          // Process all results
          if (allFlightsResults.length > 0) {
            // Remove duplicates across all combinations
            const uniqueFlights = allFlightsResults.filter(
              (flight, index, self) =>
                index === self.findIndex((f) => f.id === flight.id)
            );

            setAllFlights(uniqueFlights);
            setError(null);
            console.log(
              "✅ Successfully loaded",
              uniqueFlights.length,
              "unique flights from",
              criteria.searchCombinations.length,
              "combinations"
            );
          } else {
            setAllFlights([]);
            setError(
              errors.length > 0
                ? errors.join("; ")
                : "Không tìm thấy chuyến bay nào cho các tuyến đã chọn"
            );
          }

          setLoading(false);
          return;
        }

        // Single combination logic (existing code)

        // Check if this is a country-to-country search (from destination section)
        const isCountrySearch =
          typeof criteria.from === "string" &&
          typeof criteria.to === "string" &&
          !criteria.from.includes("(") && // Not airport format
          !criteria.to.includes("("); // Not airport format

        if (isCountrySearch) {
          console.log("🌍 COUNTRY-TO-COUNTRY SEARCH DETECTED");
          console.log("🔥 API: findFlightsBetweenCountries");
          console.log("📍 From:", criteria.from, "To:", criteria.to);

          try {
            const response = await flightApi.findFlightsBetweenCountries(
              criteria.from,
              criteria.to,
              { page: 0, size: 50 }
            );

            console.log("📥 Country search response:", response);
            console.log("📊 Response details:", {
              success: response.success,
              message: response.message,
              hasData: !!response.data,
              dataType: typeof response.data,
              isDataArray: Array.isArray(response.data),
              dataKeys: response.data ? Object.keys(response.data) : [],
              contentLength: response.data?.content?.length || 0,
            });

            if (response.success) {
              console.log("✅ Country search API response:", response);

              let flightsData = [];
              if (Array.isArray(response.data)) {
                flightsData = response.data;
              } else if (
                response.data &&
                Array.isArray(response.data.content)
              ) {
                flightsData = response.data.content;
              } else if (response.data && typeof response.data === "object") {
                flightsData = [response.data];
              }

              const mappedFlights = flightsData.map((flight) => ({
                ...flight,
                id: flight.flightId,
                priceNumeric: flight.basePrice || 0,
              }));

              const uniqueFlights = mappedFlights.filter(
                (flight, index, self) =>
                  index === self.findIndex((f) => f.id === flight.id)
              );

              setAllFlights(uniqueFlights);
              setError(null);
              console.log(
                "✅ Successfully loaded",
                uniqueFlights.length,
                "flights from country search"
              );
            } else {
              console.error("❌ Country search failed:", response.message);
              setAllFlights([]);
              setError(
                response.message ||
                  "Không tìm thấy chuyến bay giữa hai quốc gia"
              );
            }
          } catch (error) {
            console.error("❌ Error in country search:", error);
            setAllFlights([]);
            setError("Có lỗi xảy ra khi tìm chuyến bay giữa hai quốc gia");
          }

          setLoading(false);
          return;
        }

        // Extract airport IDs asynchronously
        const departureAirportId = await extractAirportId(criteria.from);
        const arrivalAirportId = await extractAirportId(criteria.to);

        // Determine API call based on available data (auto-detect) or trip type
        // Priority: Data-driven decision > tripType from form

        // Auto-detect based on available data
        const hasReturnDate =
          criteria.returnDate && !isNaN(criteria.returnDate.getTime());
        const hasDepartureDate =
          criteria.departDate && !isNaN(criteria.departDate.getTime());
        const hasBothAirports = departureAirportId && arrivalAirportId;
        const hasValidAirportIds =
          departureAirportId &&
          arrivalAirportId &&
          ((typeof departureAirportId === "number" &&
            typeof arrivalAirportId === "number") ||
            (typeof departureAirportId === "string" &&
              typeof arrivalAirportId === "string"));

        console.log("🔍 Auto-detection criteria:", {
          hasReturnDate,
          hasDepartureDate,
          hasBothAirports,
          hasValidAirportIds,
          departureAirportId,
          arrivalAirportId,
          tripType: criteria.tripType,
        });

        // Validate airport IDs before proceeding
        if (!hasValidAirportIds) {
          console.error("❌ Invalid or missing airport IDs:", {
            departureAirportId,
            arrivalAirportId,
            departureType: typeof departureAirportId,
            arrivalType: typeof arrivalAirportId,
          });
          setError(
            "Không thể tìm thấy thông tin sân bay hợp lệ. Vui lòng chọn lại điểm khởi hành và điểm đến."
          );
          setAllFlights([]);
          setLoading(false);
          return;
        }

        // Determine which API path to take
        let apiPath = "unknown";
        if (hasReturnDate && hasDepartureDate && hasValidAirportIds) {
          apiPath = "auto_round_trip";
          isRoundTripSearch = true;
        } else if (hasDepartureDate && hasValidAirportIds && !hasReturnDate) {
          apiPath = "auto_one_way";
          isRoundTripSearch = false;
        } else if (criteria.tripType === "oneway") {
          apiPath = "fallback_one_way";
          isRoundTripSearch = false;
        } else if (criteria.tripType === "roundtrip") {
          apiPath = "fallback_round_trip";
          isRoundTripSearch = true;
        } else {
          apiPath = "default_all_flights";
          isRoundTripSearch = false;
        }

        console.log("🎯 API DECISION:", {
          path: apiPath,
          isRoundTripSearch,
          reason:
            hasReturnDate && hasDepartureDate && hasValidAirportIds
              ? "Has return date + departure date + valid airport IDs"
              : hasDepartureDate && hasValidAirportIds && !hasReturnDate
              ? "Has departure date + valid airport IDs, no return date"
              : criteria.tripType === "oneway"
              ? "Fallback: tripType is oneway"
              : criteria.tripType === "roundtrip"
              ? "Fallback: tripType is roundtrip"
              : "Default: no matching criteria",
        });

        console.log("🔥 ========== EXECUTING API CALL ==========");

        // If we have all required data for round trip, use round trip API
        if (hasReturnDate && hasDepartureDate && hasValidAirportIds) {
          console.log(
            "🔄 AUTO: Using ROUND TRIP search API (has return date + valid airport IDs)"
          );
          console.log("🔥 API: searchRoundTripFlights");

          const roundTripParams = {
            departureAirportId: departureAirportId,
            arrivalAirportId: arrivalAirportId,
            outboundDate: criteria.departDate
              ? (() => {
                  const localDate = new Date(criteria.departDate);
                  const year = localDate.getFullYear();
                  const month = String(localDate.getMonth() + 1).padStart(
                    2,
                    "0"
                  );
                  const day = String(localDate.getDate()).padStart(2, "0");
                  return `${year}-${month}-${day}`;
                })()
              : null,
            returnDate: criteria.returnDate
              ? (() => {
                  const localDate = new Date(criteria.returnDate);
                  const year = localDate.getFullYear();
                  const month = String(localDate.getMonth() + 1).padStart(
                    2,
                    "0"
                  );
                  const day = String(localDate.getDate()).padStart(2, "0");
                  return `${year}-${month}-${day}`;
                })()
              : null,
            page: 0,
            size: 50,
          };

          console.log("� ROUND TRIP API CALL PARAMETERS:", {
            endpoint: "searchRoundTripFlights",
            params: roundTripParams,
            airportIdTypes: {
              departureType: typeof departureAirportId,
              arrivalType: typeof arrivalAirportId,
              departureValue: departureAirportId,
              arrivalValue: arrivalAirportId,
            },
            rawCriteria: {
              from: criteria.from,
              to: criteria.to,
              departDate: criteria.departDate,
              returnDate: criteria.returnDate,
              departDateType: typeof criteria.departDate,
              returnDateType: typeof criteria.returnDate,
              departDateISOString: criteria.departDate?.toISOString(),
              returnDateISOString: criteria.returnDate?.toISOString(),
            },
            extractedIds: {
              departureAirportId,
              arrivalAirportId,
              departureType: typeof departureAirportId,
              arrivalType: typeof arrivalAirportId,
            },
          });

          response = await flightApi.searchRoundTripFlights(roundTripParams);
          console.log("📥 ROUND TRIP API RESPONSE:", {
            success: response.success,
            message: response.message,
            status: response.status,
            data: response.data,
            dataType: typeof response.data,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            totalElements: response.data?.totalElements,
            contentLength: response.data?.content?.length,
            isContentArray: Array.isArray(response.data?.content),
            firstFlight: response.data?.content?.[0] || "No flights",
          });
        }
        // If we have departure date and airports but no return date, use one way API
        else if (hasDepartureDate && hasValidAirportIds && !hasReturnDate) {
          console.log("➡️ AUTO: Using ONE WAY search API (no return date)");
          console.log("🔥 API: searchOneWayFlights");

          const oneWayParams = {
            departureAirportId: departureAirportId,
            arrivalAirportId: arrivalAirportId,
            date: criteria.departDate
              ? (() => {
                  const localDate = new Date(criteria.departDate);
                  const year = localDate.getFullYear();
                  const month = String(localDate.getMonth() + 1).padStart(
                    2,
                    "0"
                  );
                  const day = String(localDate.getDate()).padStart(2, "0");
                  return `${year}-${month}-${day}`;
                })()
              : null,
            page: 0,
            size: 50,
          };

          console.log("� ONE WAY API CALL PARAMETERS:", {
            endpoint: "searchOneWayFlights",
            params: oneWayParams,
            airportIdTypes: {
              departureType: typeof departureAirportId,
              arrivalType: typeof arrivalAirportId,
              departureValue: departureAirportId,
              arrivalValue: arrivalAirportId,
            },
            rawCriteria: {
              from: criteria.from,
              to: criteria.to,
              departDate: criteria.departDate,
              departDateType: typeof criteria.departDate,
              departDateISOString: criteria.departDate?.toISOString(),
            },
            extractedIds: {
              departureAirportId,
              arrivalAirportId,
              departureType: typeof departureAirportId,
              arrivalType: typeof arrivalAirportId,
            },
          });

          response = await flightApi.searchOneWayFlights(oneWayParams);
          console.log("📥 ONE WAY API RESPONSE:", {
            success: response.success,
            message: response.message,
            status: response.status,
            data: response.data,
            dataType: typeof response.data,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            totalElements: response.data?.totalElements,
            contentLength: response.data?.content?.length,
            isContentArray: Array.isArray(response.data?.content),
            firstFlight: response.data?.content?.[0] || "No flights",
          });
        }
        // Fallback to tripType-based logic if auto-detection fails
        else if (criteria.tripType === "oneway" && !hasDepartureDate) {
          console.log(
            "➡️ FALLBACK: Using ONE WAY search API (tripType: oneway, no depart date)"
          );
          console.log("🔥 API: searchOneWayFlights (fallback)");

          if (!hasValidAirportIds) {
            console.warn(
              "⚠️ Invalid or missing airport IDs for one way search:",
              {
                departureAirportId,
                arrivalAirportId,
                departureType: typeof departureAirportId,
                arrivalType: typeof arrivalAirportId,
              }
            );
            setError(
              "Không thể tìm thấy ID sân bay hợp lệ. Vui lòng chọn lại điểm khởi hành và điểm đến."
            );
            setAllFlights([]);
            setLoading(false);
            return;
          } else {
            const oneWayParams = {
              departureAirportId: departureAirportId,
              arrivalAirportId: arrivalAirportId,
              date: criteria.departDate
                ? (() => {
                    const localDate = new Date(criteria.departDate);
                    const year = localDate.getFullYear();
                    const month = String(localDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const day = String(localDate.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                  })()
                : null,
              page: 0,
              size: 100, // Increased from 50 to get more results
            };

            console.log("� FALLBACK ONE WAY API CALL PARAMETERS:", {
              endpoint: "searchOneWayFlights",
              params: oneWayParams,
              rawCriteria: {
                from: criteria.from,
                to: criteria.to,
                departDate: criteria.departDate,
                tripType: criteria.tripType,
                departDateType: typeof criteria.departDate,
                departDateISOString: criteria.departDate?.toISOString(),
              },
              extractedIds: {
                departureAirportId,
                arrivalAirportId,
                departureType: typeof departureAirportId,
                arrivalType: typeof arrivalAirportId,
              },
            });

            response = await flightApi.searchOneWayFlights(oneWayParams);
            console.log("📥 FALLBACK ONE WAY API RESPONSE:", {
              success: response.success,
              message: response.message,
              status: response.status,
              data: response.data,
              dataType: typeof response.data,
              hasData: !!response.data,
              dataKeys: response.data ? Object.keys(response.data) : [],
              totalElements: response.data?.totalElements,
              contentLength: response.data?.content?.length,
              isContentArray: Array.isArray(response.data?.content),
              firstFlight: response.data?.content?.[0] || "No flights",
            });
          }
        } else if (criteria.tripType === "roundtrip" && !hasReturnDate) {
          console.log(
            "🔄 FALLBACK: Using ROUND TRIP search API (tripType: roundtrip, no return date)"
          );
          console.log("🔥 API: searchRoundTripFlights (fallback)");

          if (!hasValidAirportIds) {
            console.warn(
              "⚠️ Invalid or missing airport IDs for round trip search:",
              {
                departureAirportId,
                arrivalAirportId,
                departureType: typeof departureAirportId,
                arrivalType: typeof arrivalAirportId,
              }
            );
            setError(
              "Không thể tìm thấy ID sân bay hợp lệ. Vui lòng chọn lại điểm khởi hành và điểm đến."
            );
            setAllFlights([]);
            setLoading(false);
            return;
          } else {
            const roundTripParams = {
              departureAirportId: departureAirportId,
              arrivalAirportId: arrivalAirportId,
              outboundDate: criteria.departDate
                ? (() => {
                    const localDate = new Date(criteria.departDate);
                    const year = localDate.getFullYear();
                    const month = String(localDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const day = String(localDate.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                  })()
                : null,
              returnDate: criteria.returnDate
                ? (() => {
                    const localDate = new Date(criteria.returnDate);
                    const year = localDate.getFullYear();
                    const month = String(localDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const day = String(localDate.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                  })()
                : null,
              page: 0,
              size: 100, // Increased from 50 to get more results
            };

            console.log("� FALLBACK ROUND TRIP API CALL PARAMETERS:", {
              endpoint: "searchRoundTripFlights",
              params: roundTripParams,
              rawCriteria: {
                from: criteria.from,
                to: criteria.to,
                departDate: criteria.departDate,
                returnDate: criteria.returnDate,
                tripType: criteria.tripType,
                departDateType: typeof criteria.departDate,
                returnDateType: typeof criteria.returnDate,
                departDateISOString: criteria.departDate?.toISOString(),
                returnDateISOString: criteria.returnDate?.toISOString(),
              },
              extractedIds: {
                departureAirportId,
                arrivalAirportId,
                departureType: typeof departureAirportId,
                arrivalType: typeof arrivalAirportId,
              },
            });

            response = await flightApi.searchRoundTripFlights(roundTripParams);
            console.log("📥 FALLBACK ROUND TRIP API RESPONSE:", {
              success: response.success,
              message: response.message,
              status: response.status,
              data: response.data,
              dataType: typeof response.data,
              hasData: !!response.data,
              dataKeys: response.data ? Object.keys(response.data) : [],
              totalElements: response.data?.totalElements,
              contentLength: response.data?.content?.length,
              isContentArray: Array.isArray(response.data?.content),
              firstFlight: response.data?.content?.[0] || "No flights",
            });
          }
          // Default: No valid search criteria - don't fetch anything
          console.log(
            "📋 No valid search criteria found - not fetching flights"
          );
          console.log(
            "📤 Sending empty results to result section (no valid criteria)..."
          );
          setAllFlights([]);
          setError(
            "Vui lòng nhập đầy đủ thông tin tìm kiếm (điểm khởi hành, điểm đến, ngày khởi hành)"
          );
          setLoading(false);
          return;
        }
        // Close the else block for if (!criteria)
      }

      if (response.success) {
        console.log("✅ API Response successful:", response);
        console.log("✅ Response data structure:", {
          data: response.data,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          hasContent:
            response.data &&
            typeof response.data === "object" &&
            "content" in response.data,
          contentType: response.data?.content
            ? typeof response.data.content
            : "N/A",
          contentIsArray: Array.isArray(response.data?.content),
          dataKeys: response.data ? Object.keys(response.data) : [],
        });

        // Check if data is empty
        if (
          !response.data ||
          (Array.isArray(response.data) && response.data.length === 0) ||
          (response.data.content &&
            Array.isArray(response.data.content) &&
            response.data.content.length === 0)
        ) {
          console.log("⚠️ API returned empty data");
          setAllFlights([]);
          setError("Không tìm thấy chuyến bay nào cho tuyến đường đã chọn");
          setLoading(false);
          return;
        }

        // Handle different response formats
        let flightsData = [];
        if (Array.isArray(response.data)) {
          flightsData = response.data;
          console.log("📊 Data format: Direct array");
        } else if (response.data && Array.isArray(response.data.content)) {
          flightsData = response.data.content;
          console.log("📊 Data format: Content array");
        } else if (response.data && Array.isArray(response.data.data)) {
          flightsData = response.data.data;
          console.log("📊 Data format: Data array");
        } else if (response.data && typeof response.data === "object") {
          // Handle round trip format with roundTripPairs
          if (
            isRoundTripSearch &&
            response.data.roundTripPairs &&
            Array.isArray(response.data.roundTripPairs)
          ) {
            console.log("🔄 ROUND TRIP PAIRS FORMAT DETECTED");
            console.log(
              "📊 Round trip pairs:",
              response.data.roundTripPairs.length
            );

            // Convert roundTripPairs to flight objects for FlightCard
            flightsData = response.data.roundTripPairs.map((pair) => ({
              ...pair.outbound, // Use outbound as base
              roundTripPairs: [pair], // Keep original structure for FlightCard
              isRoundTrip: true,
              returnFlight: pair.inbound,
              combinedPrice:
                (pair.outbound.basePrice || 0) + (pair.inbound.basePrice || 0),
            }));
            console.log("✅ Processed round trip pairs:", flightsData.length);
          }
          // Handle round trip format with outboundFlights and returnFlights
          else if (
            isRoundTripSearch &&
            response.data.outboundFlights &&
            response.data.returnFlights
          ) {
            console.log("🔄 ROUND TRIP FORMAT DETECTED");
            console.log(
              "📊 Outbound flights:",
              response.data.outboundFlights.length
            );
            console.log(
              "📊 Return flights:",
              response.data.returnFlights.length
            );

            // Combine outbound and return flights
            flightsData = [
              ...response.data.outboundFlights,
              ...response.data.returnFlights,
            ];
            console.log("✅ Combined flights:", flightsData.length);
          } else {
            // Handle single flight object
            flightsData = [response.data];
            console.log("📊 Data format: Single object");
          }
        } else {
          console.warn("⚠️ Unexpected response data format:", response.data);
          flightsData = [];
        }

        console.log(
          "✅ Processed flightsData:",
          flightsData,
          "length:",
          flightsData.length
        );

        if (!Array.isArray(flightsData)) {
          console.error("❌ flightsData is not an array:", flightsData);
          setAllFlights([]);
          setError("Dữ liệu chuyến bay không đúng định dạng");
          setLoading(false);
          return;
        }

        const mappedFlights = flightsData.map((flight) => ({
          // Return raw data from API, let FlightCard handle formatting
          ...flight,
          // Add computed fields that result-section needs
          id: flight.flightId,
          priceNumeric: flight.basePrice || 0,
        }));

        // Remove duplicates
        const uniqueFlights = mappedFlights.filter(
          (flight, index, self) =>
            index === self.findIndex((f) => f.id === flight.id)
        );

        setAllFlights(uniqueFlights);
        setError(null); // Clear any previous error
        console.log("✅ Successfully loaded", uniqueFlights.length, "flights");
        console.log("🎯 FINAL FLIGHTS RESULT:", {
          totalFlights: uniqueFlights.length,
          flights: uniqueFlights.slice(0, 3), // Show first 3 flights
          allIds: uniqueFlights.map((f) => f.id),
          hasFlights: uniqueFlights.length > 0,
        });
        console.log("📤 Sending flights to result section...");
      } else {
        console.error("❌ Failed to fetch flights:", response.message);
        console.log("❌ ========== FLIGHT SEARCH FAILED ==========");
        setAllFlights([]);
        setError(response.message || "Không thể tải danh sách chuyến bay");
      }
    } catch (error) {
      console.error("❌ Error fetching flights:", error);
      console.log("❌ ========== FLIGHT SEARCH ERROR ==========");
      setAllFlights([]);
      setError("Có lỗi xảy ra khi tải danh sách chuyến bay");
    } finally {
      setLoading(false);
    }
  }, []); // No external dependencies needed

  useEffect(() => {
    console.log(
      "🔄 useFlightData: searchCriteria changed, fetching flights:",
      searchCriteria
    );
    // Always fetch flights - either with criteria or default all flights
    fetchFlights(searchCriteria);
  }, [searchCriteria, fetchFlights]);

  return { allFlights, loading, error };
};

export { useFlightData };
