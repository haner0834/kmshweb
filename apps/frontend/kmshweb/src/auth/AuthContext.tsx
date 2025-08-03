// AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

type AuthContextType = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  refreshAccessToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const refreshAccessToken = async (): Promise<string> => {
    try {
      const res = await fetch("http:localhost:3000/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!data.accessToken) throw new Error("No access token returned");

      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (err) {
      setAccessToken(null);
      throw new Error("Unable to refresh");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
