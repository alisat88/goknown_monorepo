import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import React from "react";

class Axios {
  public api = {} as AxiosInstance;

  constructor() {
    const environment = process.env.REACT_APP_ENVIRONMENT || "production";
    const apiURLs: Record<string, string | undefined> = {
      development: process.env.REACT_APP_DEVELOPMENT_API,
      staging: process.env.REACT_APP_STAGING_API,
      production: process.env.REACT_APP_PRODUCTION_API,
    };
    const baseURL = (apiURLs[environment] || "http://localhost:3333").replace(
      /\/$/,
      ""
    );

    this.api = axios.create({
      baseURL,
      timeout: 10000,
    });

    this.interceptors();
  }

  interceptors() {
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        // if (error.response?.status === 403) {
        //   localStorage.removeItem("@GoKnown:token");
        //   localStorage.removeItem("@GoKnown:user");
        //   window.location.href = "/";
        // }

        const errorMessage = error.response
          ? (error.response.data as any)?.message ||
            (error.response.data as any)?.error ||
            `Request failed with status ${error.response.status}`
          : error.message || "Network error — could not reach the server";

        const errorFormatted = {
          message: errorMessage,
          response: {
            status: error.response?.status || 500,
            data: {
              message: errorMessage,
              error: errorMessage,
            },
          },
        };

        return Promise.reject(errorFormatted);
      }
    );
  }
}

export default new Axios().api;
