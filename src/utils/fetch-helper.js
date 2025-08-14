import { toast } from "sonner";

/**
 * Generic fetch handler
 * @param {Function} apiCall - The API function to call 
 * @param {Function} setData - The setter to update state 
 * @param {Function} [setLoading] - Optional loading setter
 * @param {string} [errorMessage] - Optional error message prefix
 */
export const handleFetch = async ({
  apiCall,
  setData,
  setLoading,
  errorMessage = "Failed to fetch data",
}) => {
  try {
    if (setLoading) setLoading(true);

    const response = await apiCall();

    if (response.success) {
      setData(response.data || []);
    } else {
      toast.error(`${errorMessage}: ${response.message}`);
    }
  } catch (error) {
    toast.error(`${errorMessage}: ${error.message}`);
  } finally {
    if (setLoading) setLoading(false);
  }
};