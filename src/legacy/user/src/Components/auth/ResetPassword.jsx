import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ShowPasswordIcon from "../../assets/svgs/ShowPasswordIcon";
import HidePasswordIcon from "../../assets/svgs/HidePasswordIcon";
import "./Css/defaultCSSForAuthFLow.css";
// import "./Css/userbox.css";
// import "./Css/style2.css";
import { APP_ROUTES } from "../../utils/AppConstants";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "../../api/actions/authActions";
import { resetatStatus } from "../../api/reducerSlices/authSlice";

const ResetPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error, message, authenticated, emailfrs } = useSelector(
    (state) => state.auth,
  );
  const [formData, setFormData] = useState({
    email: (emailfrs && emailfrs) || "", // Add the missing email field
    password: "",
  });

  useEffect(() => {
    console.log(emailfrs);
    if (status === "succeeded" && authenticated === true) {
      dispatch(resetatStatus());
      alert(message);
      navigate(APP_ROUTES.SIGN_IN_ROUTE);
    }
    // if (status === "failed" && error !== "" && error !== null) {
    //   alert(error);
    // }
  }, [status, authenticated]);

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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

  // const handleTogglePassword = () => {
  //   setShowPassword(!showPassword);
  // };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    // if (!state.userEmail.trim()) {
    //   newErrors.email = "Please enter your email address";
    // }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSend = {
      email: emailfrs,
      password: formData.password.trim(),
    };
    console.log("reseting ", dataToSend);
    dispatch(resetPassword(dataToSend));
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
          <form onSubmit={handleSubmit} className="fm">
            <span>Reset Password</span>
            <div className="inputBox">
              <label htmlFor="email">Email Address:</label>
              <input
                disabled={true}
                type="email"
                id="email"
                placeholder="example@gmail.com"
                value={emailfrs}
                onChange={handleChange}
                autoFocus
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            {/* <div className="inputBox">
              <label htmlFor="password">Password:</label>
              <div className="password-input pos-rel">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="set"
                  placeholder="**************"
                  value={formData.password}
                  onChange={handleChange}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleTogglePassword("password")}
                  className="password-toggle btn"
                >
                  {showPassword ? <ShowPasswordIcon /> : <HidePasswordIcon />}
                </button>
              </div>
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </div> */}
            <div className="inputBox pos-rel">
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
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ResetPassword;
