import axios from "axios";

const createPolymarketApiInstance = () => {
    const axiosInstance = axios.create({
        baseURL: 'https://gamma-api.polymarket.com'
    })
    axiosInstance.interceptors.response.use(
        response => response, // handle success
        async error => {
            if (error.response && error.response.status === 429) {
                const retryAfter = error.response.headers['retry-after'];

                // If the Retry-After header exists, use it, otherwise default to 1 second
                const delay = retryAfter
                    ? parseInt(retryAfter, 10) * 1000 // Convert seconds to milliseconds
                    : 1000; // Default to 1 second if Retry-After is not present

                // Delay for the specified time
                await new Promise(resolve => setTimeout(resolve, delay));

                // Retry the request
                return axiosInstance(error.config);
            }

            // If not 429, reject the promise
            return {
                data: [], // Empty data
                status: 200, // Use 200 to indicate success despite no data
                statusText: 'OK',
                headers: {},
                config: error.config,
                request: error.request
            };
        }
    );
    return axiosInstance
}

const polymarketapi = createPolymarketApiInstance()
export {polymarketapi};