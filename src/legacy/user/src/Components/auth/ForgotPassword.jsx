import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Css/defaultCSSForAuthFLow.css";
// import "./Css/forgot.css";
import { APP_ROUTES } from "../../utils/AppConstants";
// import { useSelector } from "react-redux";
import { forgotPassword } from "../../api/actions/authActions";
import { useDispatch, useSelector } from "react-redux";
import { resetatStatus } from "../../api/reducerSlices/authSlice";
// import LoadingSpinner from "../../../utils/LoadingSpinner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error, message, authenticated } = useSelector(
    (state) => state.auth
  );
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (status === "succeeded" && authenticated === true) {
      dispatch(resetatStatus());
      navigate(APP_ROUTES.VERIFY_OTP_ROUTE);
    }
    // if (status === "failed" && error !== "" && error !== null) {
    //   alert(error);
    // }
  }, [status, authenticated]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });

    // Clear the error when the user starts typing
    setErrors({
      ...errors,
      [e.target.id]: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSend = {
      email: formData.email.trim(),
    };
    dispatch(forgotPassword(dataToSend));
  };

  return (
    <div className="authPage">
      <div className="ContentBox">
        <div className="coverBox">
          <span>Bike Auction Hub</span>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci
            dolorem voluptatibus minus totam sit sequi!
          </p>
          <div className="coverBoxPic">{/* <img src={} alt="" /> */}</div>
        </div>
        <div className="formBox">
          <form onSubmit={handleSubmit}>
            <span>FORGOT PASSWORD</span>
            <div className="inputBox fc">
              <label htmlFor="email">Email Address:</label>
              <input
                type="email"
                id="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            <div className="inputBox">
              <Link to={APP_ROUTES.SIGN_IN_ROUTE}>Back to Login</Link>
            </div>
            <button type="submit">CONTINUE</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
