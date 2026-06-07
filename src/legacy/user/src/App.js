import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Components/auth/Login";
// import ForgotPassword from "./Componenets/auth/ForgotPassword";
import ForgotPassword from "./Components/auth/ForgotPassword";
import Signup from "./Components/auth/Signup";
import ResetPassword from "./Components/auth/ResetPassword";
import OTPScreen from "./Components/auth/OTPScreen";
import HomeScreen from "./Components/home/homePage.jsx";
import Dashboard from "./Components/home/DASHBOARD/Dashboard.jsx";
import Profile from "./Components/home/PROFILE/Profile";
import OnRide from "./Components/home/ONRIDE/OnRide";
import OpenAuction from "./Components/home/AUCTION/OpenAuction";
import Wallet from "./Components/home/WALLET/Wallet";
import Setting from "./Components/home/SETTING/Setting";
import { APP_ROUTES } from "./utils/AppConstants";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

function App() {
  return (
    // <Router basename="/riderentalhub">
    <Router basename="/user">
      <Routes>
        <Route path={APP_ROUTES.APP_DEFAULT_ROUTE} exact element={<Login />} />
        <Route path={APP_ROUTES.SIGN_IN_ROUTE} element={<Login />} />
        <Route path={APP_ROUTES.SIGN_UP_ROUTE} element={<Signup />} />
        <Route
          path={APP_ROUTES.FORGOT_PASSWORD_ROUTE}
          element={<ForgotPassword />}
        />
        <Route
          path={APP_ROUTES.RESET_PASSWORD_ROUTE}
          element={<ResetPassword />}
        />
        <Route path={APP_ROUTES.VERIFY_OTP_ROUTE} element={<OTPScreen />} />

        <Route element={<ProtectedRoute />}>
          <Route path={APP_ROUTES.HOME_ROUTE} exact element={<HomeScreen />} />
          <Route
            path={APP_ROUTES.DASHBOARD_ROUTE}
            exact
            element={<Dashboard />}
          />
          <Route path={APP_ROUTES.WALLET_ROUTE} exact element={<Wallet />} />
          <Route path={APP_ROUTES.PROFILE_ROUTE} exact element={<Profile />} />
          <Route path={APP_ROUTES.ON_RIDE_ROUTE} exact element={<OnRide />} />
          <Route
            path={APP_ROUTES.OPEN_AUCTION_ROUTE}
            exact
            element={<OpenAuction />}
          />
          <Route path={APP_ROUTES.SETTING_ROUTE} exact element={<Setting />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
