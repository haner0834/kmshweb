import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const setupInterceptors = (
  getToken: () => string,
  refreshToken: () => Promise<string>
) => {
  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (err) => {
      if (err.response?.status === 401) {
        try {
          const newToken = await refreshToken();
          err.config.headers["Authorization"] = `Bearer ${newToken}`;
          return api.request(err.config);
        } catch {
          return Promise.reject(err);
        }
      }
      return Promise.reject(err);
    }
  );
};

export default api;
