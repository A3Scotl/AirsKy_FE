import { useEffect, useRef, useState, useCallback } from "react";
export const useChartWorker = () => {
  const workerRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const requestQueue = useRef(new Map());

  // Initialize worker with better error handling
  useEffect(() => {
    if (typeof Worker !== "undefined") {
      try {
        workerRef.current = new Worker(
          new URL("../workers/chart-worker.js", import.meta.url)
        );

        workerRef.current.onmessage = (e) => {
          const {
            success,
            type,
            result,
            error: workerError,
            requestId,
          } = e.data;

          setIsProcessing(false);

          if (success) {
            setError(null);
            // Handle queued requests
            if (requestId && requestQueue.current.has(requestId)) {
              const { resolve } = requestQueue.current.get(requestId);
              requestQueue.current.delete(requestId);
              resolve(result);
            }
          } else {
            setError(workerError || "Processing failed");
            if (requestId && requestQueue.current.has(requestId)) {
              const { reject } = requestQueue.current.get(requestId);
              requestQueue.current.delete(requestId);
              reject(new Error(workerError || "Processing failed"));
            }
          }
        };

        workerRef.current.onerror = (error) => {
          console.error("Web Worker error:", error);
          setIsProcessing(false);
          setError(`Worker error: ${error.message}`);

          // Reject all pending requests
          requestQueue.current.forEach(({ reject }) => {
            reject(new Error("Worker crashed"));
          });
          requestQueue.current.clear();
        };

      } catch (error) {
        console.warn("⚠️ Failed to initialize Web Worker:", error);
        setError("Web Worker not supported");
      }
    } else {
      console.warn("⚠️ Web Workers not supported in this browser");
      setError("Web Workers not supported");
    }

    // Cleanup worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      requestQueue.current.clear();
    };
  }, []);

  // Optimized function to send data to worker with batching and timeout
  const processData = useCallback((type, data, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        console.warn("Web Worker not available, using fallback processing");
        reject(new Error("Web Worker not supported"));
        return;
      }

      // Generate unique request ID
      const requestId = `${type}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Store request in queue
      requestQueue.current.set(requestId, { resolve, reject });

      setIsProcessing(true);
      setError(null);

      // Add timeout for requests
      const timeout = options.timeout || 10000; // 10 seconds default
      const timeoutId = setTimeout(() => {
        if (requestQueue.current.has(requestId)) {
          requestQueue.current.delete(requestId);
          setIsProcessing(false);
          reject(new Error(`Request timeout after ${timeout}ms`));
        }
      }, timeout);

      // Enhanced message with metadata
      const message = {
        type,
        data,
        requestId,
        timestamp: Date.now(),
        options: {
          batchSize: options.batchSize || 1000,
          useOptimization: options.useOptimization !== false,
        },
      };

      try {
        workerRef.current.postMessage(message);

        // Clear timeout when request completes
        const originalResolve = resolve;
        const originalReject = reject;

        requestQueue.current.set(requestId, {
          resolve: (result) => {
            clearTimeout(timeoutId);
            originalResolve(result);
          },
          reject: (error) => {
            clearTimeout(timeoutId);
            originalReject(error);
          },
        });
      } catch (error) {
        clearTimeout(timeoutId);
        requestQueue.current.delete(requestId);
        setIsProcessing(false);
        reject(new Error(`Failed to send message to worker: ${error.message}`));
      }
    });
  }, []);

  // Specific processing functions
  const processRevenueData = useCallback(
    (bookings) => {
      return processData("processRevenueData", { bookings });
    },
    [processData]
  );

  const processBookingStats = useCallback(
    (bookings) => {
      return processData("processBookingStats", { bookings });
    },
    [processData]
  );

  const processFlightStats = useCallback(
    (flights) => {
      return processData("processFlightStats", { flights });
    },
    [processData]
  );

  const processCustomerStats = useCallback(
    (users) => {
      return processData("processCustomerStats", { users });
    },
    [processData]
  );

  const processAllStats = useCallback(
    (data) => {
      return processData("processAllStats", data);
    },
    [processData]
  );

  return {
    // Processing functions
    processRevenueData,
    processBookingStats,
    processFlightStats,
    processCustomerStats,
    processAllStats,

    // State
    isProcessing,
    error,

    // Utilities
    isSupported: typeof Worker !== "undefined",
  };
};
