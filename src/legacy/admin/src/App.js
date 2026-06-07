import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Componenets/auth/LoginComponent/Login";
import HomeScreen from "./Componenets/home/HomeComponent/HomeScreen";
import { APP_ROUTES } from "./utils/AppConstants";
import ProtectedRoute from "./Componenets/ProtectedRoute";

function App() {
  return (
    <Router basename="/admin">
      <Routes>
        <Route path={APP_ROUTES.SIGN_IN_ROUTE} element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path={APP_ROUTES.APP_ROUTE} element={<HomeScreen />} />
          <Route path={APP_ROUTES.HOME_ROUTE} exact element={<HomeScreen />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
