import React, { useState, useEffect } from "react";
import { WebsiteLayout } from "../components/website/WebsiteLayout";

interface AppRouterProps {
  children: React.ReactNode;
}

/**
 * Dedicated Application Router & Public Website Boundary.
 * Manages browser URL path navigation (popstate listener) and top-level
 * routing split between Public Website (WebsiteLayout) and ERP Workspace.
 */
export const AppRouter: React.FC<AppRouterProps> = ({ children }) => {
  const [routePath, setRoutePath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Render Public Website if route does not start with /app
  if (!routePath.startsWith("/app")) {
    return (
      <WebsiteLayout
        initialPath={routePath}
        onNavigateToERP={() => {
          window.history.pushState({}, "", "/app");
          setRoutePath("/app");
        }}
      />
    );
  }

  return <>{children}</>;
};
