import {OddsApiConfig} from "../types/ApiConfig";
import axios, {AxiosInstance, InternalAxiosRequestConfig} from "axios";

const createCloudbetApiInstance = (config: OddsApiConfig): AxiosInstance => {
    const instance = axios.create({
        baseURL: config.baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Add a request interceptor to include the API key in the URL for GET requests
    instance.interceptors.request.use(
        (requestConfig: InternalAxiosRequestConfig) => {
            if (requestConfig.headers) {
                requestConfig.headers['X-API-Key'] = config.apiKey;
            }
            return requestConfig;
        },
        (error) => {
            // Handle the error
            return Promise.reject(error);
        }
    );

    return instance;
};
const cloudbetapi = createCloudbetApiInstance({
    baseURL: 'https://sports-api.cloudbet.com/pub',
    apiKey: "eyJhbGciOiJSUzI1NiIsImtpZCI6IkhKcDkyNnF3ZXBjNnF3LU9rMk4zV05pXzBrRFd6cEdwTzAxNlRJUjdRWDAiLCJ0eXAiOiJKV1QifQ.eyJhY2Nlc3NfdGllciI6InRyYWRpbmciLCJleHAiOjIwNDI0NDY5OTgsImlhdCI6MTcyNzA4Njk5OCwianRpIjoiYzc2ZTExNGItMDQyNS00YTU3LWE2ZWEtMjk3Yzg4NjM1NzVhIiwic3ViIjoiMGZiYjRjNjctMTExZi00ZTgxLTk0NGItMTMyNmNlMTQyYjhmIiwidGVuYW50IjoiY2xvdWRiZXQiLCJ1dWlkIjoiMGZiYjRjNjctMTExZi00ZTgxLTk0NGItMTMyNmNlMTQyYjhmIn0.ZTOj6aLXmyhxRn_G1ZtRgcRzoczrpz7n4DtcUKAZCfC9TbTByiAfAGb6IZ0C5yrn4yCPmaxn2SlA8Hi1Ie6iE4c-NbcyopPPq3-v4XR8-tE6bjNnTt_1OomqVdBM2TAmrwdAjc8F05QFUIav4WvPds-X08DQ3iIBiG7z-G1TiU1JdhJoMh58mmXNP4qrWz0Kk7woH4aefQqXwxtcG1BciaZxArR3BX-xWGHUWIDf76Kd5lqOA1wif7JCstOZX7tWAxsOLJlXbnU4RXz3K45dte2tXc3GB5hIdvB0PEg_a8-pmg12dhft4RjfitUEBwNktuvdGe2ZCLZpqC0DcSUXwQ"
})
export {cloudbetapi};