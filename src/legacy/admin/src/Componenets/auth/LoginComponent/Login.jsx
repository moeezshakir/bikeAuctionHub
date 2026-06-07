import React, { useEffect, useState } from "react";
import "../Css/defaultSignSignUpcss.css";
import "../Css/userbox.css";
import { useNavigate } from "react-router-dom";
import ShowPasswordIcon from "../../../assets/svgs/ShowPasswordIcon";
import HidePasswordIcon from "../../../assets/svgs/HidePasswordIcon";
import { APP_ROUTES } from "../../../utils/AppConstants";
import LoadingSpinner from "../../../utils/LoadingSpinner";
import { LoginEventPopup } from "../../popup-boxes/auth-Popup's/authEventPopup";
import { useDispatch, useSelector } from "react-redux";
import { signinUser } from "../../../api/actions/authActions";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "Admin123@example.com",
    password: "12345678",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const { status, error, authenticated } = useSelector((state) => state.auth);

  const [showPopup, setShowPopup] = useState(false);
  const [showPopupMsg, setShowPopupMsg] = useState("");

  useEffect(() => {
    if (authenticated) {
      navigate(APP_ROUTES.HOME_ROUTE);
    }

    if (status === "failed") {
      setShowPopup(true);
      setShowPopupMsg(error);
    }
  }, [authenticated, status, error, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.id]: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Please enter your password";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch(signinUser(formData));
  };

  const closePopup = () => {
    setShowPopup(false);
    setShowPopupMsg("");
  };

  return (
    <>
      {status === "loading" && <LoadingSpinner />}
      {showPopup && (
        <LoginEventPopup showPopupMsg={showPopupMsg} onClose={closePopup} />
      )}
      <div className="container">
        <div className="box">
          <form onSubmit={handleSubmit}>
            <span>
              <div className="hide">Welcome to</div>
              <span className="space">Login</span>
            </span>
            <p>Enter Your Credentials And Get Ready To Explore!</p>
            <div className="input-group fc">
              <label htmlFor="email">Email Address:</label>
              <input
                type="email"
                id="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                autoFocus
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            <div className="input-group sc pos-rel">
              <label htmlFor="password">Password:</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="**************"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <ShowPasswordIcon /> : <HidePasswordIcon />}
              </button>
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </div>
            <div className="input-group"></div>
            <button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Logging in..." : "LOGIN"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
