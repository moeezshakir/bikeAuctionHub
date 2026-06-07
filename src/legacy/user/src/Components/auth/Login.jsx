import React, { useState, useEffect } from "react";
import "./Css/defaultCSSForAuthFLow.css";
import "./Css/userbox.css";
import { Link, useNavigate } from "react-router-dom";
import ShowPasswordIcon from "../../assets/svgs/ShowPasswordIcon";
import HidePasswordIcon from "../../assets/svgs/HidePasswordIcon";
import { APP_ROUTES } from "../../utils/AppConstants";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resendOTP } from "../../api/actions/authActions";
import { resetatStatus, resetError2 } from "../../api/reducerSlices/authSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { status, error, message, authenticated, emailfreg } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    // email: "test1@gmail.com",
    // password: "1234",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(resetatStatus());
  }, []);

  useEffect(() => {
    if (status === "succeeded" && authenticated === true) {
      dispatch(resetError2());
      navigate(APP_ROUTES.HOME_ROUTE);
    }
    if (status === "failed" && error !== "") {
      alert(error);
    } else if (status === "failed") {
      alert("Something went wrong!");
    }
    // if (error === "Please verify your email address first") {
    //   // dispatch(resendOTP(emailfreg));
    //   navigate(APP_ROUTES.VERIFY_OTP_ROUTE, {
    //     state: { navigateToRoute: APP_ROUTES.SIGN_IN_ROUTE },
    //   });
    // }
  }, [status, authenticated]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    // Clear the corresponding error when the user starts typing
    setErrors({
      ...errors,
      [e.target.id]: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
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

    const dataToSendForLogin = {
      email: formData.email.trim(),
      password: formData.password.trim(),
    };

    let actionfl = await dispatch(loginUser(dataToSendForLogin));
    console.log(actionfl.payload);
    if (actionfl.payload.error === "Please verify your email address first") {
      dispatch(resendOTP(emailfreg));
      navigate(APP_ROUTES.VERIFY_OTP_ROUTE, {
        state: { navigateToRoute: APP_ROUTES.SIGN_IN_ROUTE },
      });
    }
  };

  return (
    <div className="authPage">
      <div className="ContentBox">
        <div className="coverBox">
          <span>Bike Auction Hub</span>
          <p>
            Log in to your account below to access your bike auction options
            quickly and securely. Enter your email and password to get started.
          </p>
          <div className="coverBoxPic">{/* <img src={} alt="" /> */}</div>
        </div>
        <div className="formBox">
          <form onSubmit={handleSubmit}>
            <span>
              <div className="hide">Welcome to</div>
              <span className="space">Login</span>
            </span>
            <p>Enter Your Credentials And Get Ready To Explore!</p>
            <div className="inputBox">
              <label htmlFor="email">Email Address:</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                autoFocus
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            <div className="inputBox pos-rel">
              <label htmlFor="password">Password:</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
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
            <div className="inputBox">
              <Link to={APP_ROUTES.FORGOT_PASSWORD_ROUTE}>
                Forgot Password?
              </Link>
            </div>
            <button type="submit">LOGIN</button>
          </form>
          <p>
            Don't have an account?
            <Link to={APP_ROUTES.SIGN_UP_ROUTE} className="signUp">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
