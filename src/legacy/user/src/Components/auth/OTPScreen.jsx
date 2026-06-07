import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Css/defaultCSSForAuthFLow.css";
import "./Css/opt.css";
import { APP_ROUTES } from "../../utils/AppConstants";
import { useDispatch, useSelector } from "react-redux";
import { resetatStatus } from "../../api/reducerSlices/authSlice";
import { verifyOTP, resendOTP } from "../../api/actions/authActions";
import emailjs from "emailjs-com";

const OTPScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    status,
    error,
    message,
    authenticated,
    authenticatedStatus,
    yourotp,
    user_idfr,
    emailfreg,
  } = useSelector((state) => state.auth);
  const [optValues, setOptValues] = useState({
    opt1: "",
    opt2: "",
    opt3: "",
    opt4: "",
    opt5: "",
  });

  const [OTP, setOTP] = useState("");
  const [msg, setMsg] = useState("");

  const sendEmail = () => {
    const templateParams = {
      to_email: emailfreg,
      otp: yourotp,
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
          setMsg("Email sent successfully.");
        },
        (error) => {
          console.log("FAILED...", error);
          setMsg("Failed to send email.");
        }
      );
  };

  // useEffect(() => {
  //   if ((yourotp !== "" || yourotp !== null) && emailfreg !== "") {
  //     sendEmail();
  //   }
  // }, [yourotp]);

  useEffect(() => {
    if (authenticatedStatus === "registration") {
      if (status === "succeeded" && authenticated === true) {
        alert(message);
        navigate(APP_ROUTES.SIGN_IN_ROUTE);
        dispatch(resetatStatus());
      }
      if (status === "failed") {
        alert(error || "Please try again!");
      }
    } else if (
      authenticatedStatus !== "registration" &&
      status === "succeeded"
    ) {
      navigate(APP_ROUTES.RESET_PASSWORD_ROUTE);
      dispatch(resetatStatus());
    } else {
      message && alert(message);
    }
  }, [status, authenticated]);

  const handleInputChange = (e, fieldName) => {
    const { value } = e.target;

    setOptValues((prevValues) => ({
      ...prevValues,
      [fieldName]: value,
    }));

    if (value.length === 1) {
      const nextFieldName = getNextFieldName(fieldName);
      const nextInput = document.getElementsByName(nextFieldName)[0];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const resendOtp = async () => {
    let wfr = dispatch(resendOTP(emailfreg));
    if (wfr?.payload?.status === true) {
      sendEmail();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let otp = "";
    if (Object.values(optValues).every((value) => value.length === 1)) {
      Object.values(optValues).forEach((element) => {
        otp += element;
      });

      setOTP(otp);
      console.log(OTP);
      const dataToSend = {
        user_id: user_idfr,
        otp: otp,
      };
      console.log(dataToSend);
      dispatch(verifyOTP(dataToSend));

      // if (authenticatedStatus === "registration") {
      //   if (status === "succeeded" && authenticated === true) {
      //     alert(message);
      //     navigate(APP_ROUTES.SIGN_IN_ROUTE);
      //     dispatch(resetatStatus());
      //   }
      //   if (status === "failed") {
      //     alert(error || "Please try again!");
      //   }
      // } else {
      //   navigate(APP_ROUTES.RESET_PASSWORD_ROUTE);
      //   dispatch(resetatStatus());
      // }
    } else {
      // Display an error message or take appropriate action
      alert("Please fill in all fields.");
    }
  };

  const getNextFieldName = (currentFieldName) => {
    const fieldOrder = ["opt1", "opt2", "opt3", "opt4", "opt5"];
    const currentIndex = fieldOrder.indexOf(currentFieldName);
    return currentIndex < fieldOrder.length - 1
      ? fieldOrder[currentIndex + 1]
      : null;
  };

  return (
    <div className="authPage">
      <div className="ContentBox">
        <div className="coverBox">
          <span>Bike Auction Hub</span>
          {/* <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci
            dolorem voluptatibus minus totam sit sequi!
          </p> */}
          <div className="coverBoxPic">{/* <img src={} alt="" /> */}</div>
        </div>
        <div className="formBox bx">
          <form onSubmit={handleSubmit}>
            <span>OTP</span>
            <div className="inputBox">
              {["opt1", "opt2", "opt3", "opt4", "opt5"].map(
                (fieldName, index) => (
                  <input
                    key={fieldName}
                    type="text"
                    name={fieldName}
                    maxLength="1"
                    value={optValues[fieldName]}
                    onChange={(e) => handleInputChange(e, fieldName)}
                    autoFocus={index === 0}
                  />
                ),
              )}
            </div>
            {/* {yourotp && <div> {yourotp}</div>} */}
            {yourotp && <p> Please check your email or</p>}
            <button
              className="btn-nbg"
              onClick={(e) => {
                e.preventDefault();
                resendOtp();
              }}
            >
              Resend code
            </button>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPScreen;
