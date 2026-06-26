import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";

class Axios {
  public api = {} as AxiosInstance;

  constructor() {
    const environment = process.env.REACT_APP_ENVIRONMENT || "production";
    const apiURLs: Record<string, string | undefined> = {
      development: process.env.REACT_APP_DEVELOPMENT_API,
      staging: process.env.REACT_APP_STAGING_API,
      production: process.env.REACT_APP_PRODUCTION_API,
    };

    const resolvedURL = apiURLs[environment];

    // Surfaces missing build-time env var immediately in the browser console.
    // REACT_APP_* vars are baked in at build time — a runtime env var change
    // has no effect without a rebuild. Check frontend/.env.production or your
    // Render/DigitalOcean build environment variables.
    if (!resolvedURL && process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.error(
        `[GoKnown] REACT_APP_${environment.toUpperCase()}_API is not set. ` +
          "All API calls will fail. " +
          "Set this variable in frontend/.env.production or your deployment build env vars, then rebuild."
      );
    }

    const baseURL = (resolvedURL || "http://localhost:3333").replace(/\/$/, "");

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
