import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShowPasswordIcon from "../../assets/svgs/ShowPasswordIcon";
import HidePasswordIcon from "../../assets/svgs/HidePasswordIcon";
import "./Css/defaultCSSForAuthFLow.css";
import { APP_ROUTES } from "../../utils/AppConstants";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../api/actions/authActions";
import { resetError } from "../../api/reducerSlices/authSlice";
import LoadingSpinner from "../../utils/LoadingSpinner";
import emailjs from "emailjs-com";

const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [getError, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formDataForSignUp, setFormDataForSignUp] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { status, error, authenticated, yourotp, user_idfr, emailfreg } =
    useSelector((state) => state.auth);

  useEffect(() => {
    if (status === "succeeded" && authenticated === true) {
      alert("You are registered now!");
      navigate(APP_ROUTES.VERIFY_OTP_ROUTE, {
        state: { navigateToRoute: APP_ROUTES.SIGN_IN_ROUTE },
      });
      // navigate(APP_ROUTES.SIGN_IN_ROUTE);
      dispatch(resetError());
    }

    if (status === "failed" && error !== "") {
      alert(error);
    }
  }, [status, authenticated]);

  const handleChange = (e) => {
    setFormDataForSignUp({
      ...formDataForSignUp,
      [e.target.id]: e.target.value,
    });
    setError("");
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else if (field === "confirmPassword") {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const validateUsername = (name) => {
    const usernameRegex = /^[A-Za-z]{3,}[\w]*$/;
    return usernameRegex.test(name);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z][A-Za-z0-9._%+-]+@gmail\.com$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    return passwordRegex.test(password);
  };

  const sendEmail = (otp, email) => {
    const templateParams = {
      to_email: email,
      otp: otp,
    };

    console.log(templateParams);

    emailjs
      .send(
        "service_hv93xeo", // Replace with your EmailJS service ID
        "template_6qthvak", // Replace with your EmailJS template ID
        templateParams,
        "snnj4zUhD3s5UYh1l" // Replace with your EmailJS user ID
      )
      .then(
        (response) => {
          console.log("SUCCESS!", response.status, response.text);
          // setMsg("Email sent successfully.");
        },
        (error) => {
          console.log("FAILED...", error);
          // setMsg("Failed to send email.");
        }
      );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, confirmPassword } = formDataForSignUp;

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateUsername(name)) {
      setError("Username must start with at least three alphabetic characters");
      return;
    }

    if (!validateEmail(email)) {
      setError(
        "Please enter a valid email address and use your google account."
      );
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters long, contain a special character, and a capital letter"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password must match");
      return;
    }

    const dataToSendForSignup = {
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
    };

    let grfr = await dispatch(registerUser(dataToSendForSignup));
    if (grfr?.payload?.status === true) {
      sendEmail(grfr?.payload?.otp, grfr?.payload?.userEmail);
    }
  };

  return (
    <>
      {status === "loading" && <LoadingSpinner />}
      <div className="authPage">
        <div className="ContentBox">
          <div className="coverBox">
            <span>Bike Auction Hub</span>
            <p>
              Sign up for Bike Auction Hub in seconds. Just enter your basic
              details and start exploring bike auctions hassle-free!
            </p>
            <span className="error" style={{ fontSize: "20px" }}>
              Note: use your google account.
            </span>
          </div>
          <div className="formBox">
            <form onSubmit={handleSubmit}>
              <span>
                <div className="hide">Welcome to</div>
                <span className="space">SIGN UP</span>
              </span>
              <p>Enter Your Credentials And Get Ready To Explore!</p>
              <div className="inputBox">
                <label htmlFor="name">Username:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Username"
                  value={formDataForSignUp.name}
                  onChange={handleChange}
                  autoFocus
                />
              </div>
              <div className="inputBox">
                <label htmlFor="email">Email Address:</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="example@gmail.com"
                  value={formDataForSignUp.email}
                  onChange={handleChange}
                />
              </div>
              <div className="inputBox pos-rel">
                <label htmlFor="password">Password:</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="**************"
                  value={formDataForSignUp.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle btn"
                  onClick={() => togglePasswordVisibility("password")}
                >
                  {showPassword ? <ShowPasswordIcon /> : <HidePasswordIcon />}
                </button>
              </div>
              <div className="inputBox pos-rel">
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="**************"
                  value={formDataForSignUp.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle btn"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                >
                  {showConfirmPassword ? (
                    <ShowPasswordIcon />
                  ) : (
                    <HidePasswordIcon />
                  )}
                </button>
              </div>
              {getError && <span className="error">{getError}</span>}
              <button type="submit">SIGN UP</button>
            </form>
            <p>
              Already a Member?
              <Link to={APP_ROUTES.SIGN_IN_ROUTE} className="login">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
