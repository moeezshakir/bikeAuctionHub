import React from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";
import { APP_ROUTES } from "../utils/AppConstants";

export default function ProtectedRoute() {
  const authenticated = useSelector((state) => state.auth.authenticated);
  return !authenticated ? (
    <Navigate to={APP_ROUTES.SIGN_IN_ROUTE} />
  ) : (
    <Outlet />
  );
}
