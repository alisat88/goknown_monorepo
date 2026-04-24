import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import React from "react";

class Axios {
  public api = {} as AxiosInstance;

  constructor() {
    // 🔥 FORCE LOCAL BACKEND (this fixes your login issue)
    const baseURL = "http://localhost:3333";

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

        const errorFormatted = {
          response: {
            status: error.response?.status || 500,
            data: {
              error: error.response
                ? (error.response.data as any)?.message ||
                  (error.response.data as any)?.error
                : "Internal Server Error",
            },
          },
        };

        return Promise.reject(errorFormatted);
      }
    );
  }
}

export default new Axios().api;
