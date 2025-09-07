import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến hãng hàng không (airline)
 */
export const aircraftApi = {

  getAllAircrafts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/aircrafts?${queryString}` : "/aircrafts";
    return apiHandler("get", endpoint);
  },




};
