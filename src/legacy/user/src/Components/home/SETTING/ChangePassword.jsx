import React, { useState, useEffect } from "react";
import ShowPasswordIcon from "../../../assets/svgs/ShowPasswordIcon";
import HidePasswordIcon from "../../../assets/svgs/HidePasswordIcon";
import MoveBackIcon from "../../../assets/svgs/MoveBackIcon";
import { useDispatch, useSelector } from "react-redux";
import {
  checkCurrentPassword,
  changePassword,
} from "../../../api/actions/homeActions";
import { resetState2 } from "../../../api/reducerSlices/homeSlice";
require("../homeCSS/Settings-Style/changePaword.css");

const ChangePassword = ({ goBack }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    status,
    error: hsError,
    currentPasswordStatus,
    passwordChangeStatus,
  } = useSelector((state) => state.homeSlice);

  const [step, setStep] = useState(1); // Track the current step (1 or 2)
  const [loading, setLoading] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null); // Store any error messages
  const [showOldPassword, setShowOldPassword] = useState(false); // Track visibility of old password
  const [showNewPassword, setShowNewPassword] = useState(false); // Track visibility of new password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Track visibility of confirm password

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    }
    if (status === "succeeded" && currentPasswordStatus === true) {
      alert("Current Password oky");
      setLoading(false);
    }
    if (status === "failed" && currentPasswordStatus === false) {
      alert(hsError);
      setLoading(false);
    }
    if (status !== "") {
      dispatch(resetState2());
    }
  }, [status, currentPasswordStatus]);

  useEffect(() => {
    if (status === "succeeded" && passwordChangeStatus === true) {
      alert("Password Changed!");
    }
    if (status === "failed" && passwordChangeStatus === false) {
      alert(hsError);
    }
    if (status !== "") {
      dispatch(resetState2());
    }
    setLoading(false);
  }, [status, passwordChangeStatus]);

  const handleOldPasswordChange = (event) => {
    setOldPassword(event.target.value);
  };

  const handleNewPasswordChange = (event) => {
    setNewPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  };

  const toggleShowPassword = (field) => {
    switch (field) {
      case "old":
        setShowOldPassword(!showOldPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const handleNext = async () => {
    setError(null); // Clear any previous errors

    if (!oldPassword) {
      setError("Please enter your current password.");
      return;
    }

    let dataToSend = {
      user_id: user?.user_id,
      current_password: oldPassword,
    };

    let data = await dispatch(checkCurrentPassword(dataToSend));
    if (data.payload.status === true) {
      setStep(2);
    }
    if (data.payload.status === false) {
      setError("Incorrect current password.");
      return;
    }
  };

  const handleSubmit = async () => {
    setError(null); // Clear any previous errors

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    let dataToSend = {
      user_id: user?.user_id,
      new_password: newPassword,
    };

    let data = await dispatch(changePassword(dataToSend));
    if (data.payload.status === true) {
      setStep(1);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const renderStep1 = () => (
    <div className="formContainer">
      <span>Current Password</span>
      <div className="change-password-input">
        <input
          type={showOldPassword ? "text" : "password"} // Change type based on visibility state
          placeholder="Current Password"
          value={oldPassword}
          onChange={handleOldPasswordChange}
        />
        <div
          className="password-toggle"
          onClick={() => toggleShowPassword("old")}
        >
          {showOldPassword ? <ShowPasswordIcon /> : <HidePasswordIcon />}
          {/* Toggle icon based on visibility state */}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <button onClick={handleNext}>{loading ? "checking..." : "Next"}</button>
    </div>
  );

  const renderStep2 = () => (
    <div className="formContainer">
      <span>Create new Password</span>
      <div className="change-password-input">
        <input
          type={showNewPassword ? "text" : "password"} // Change type based on visibility state
          placeholder="New Password"
          value={newPassword}
          onChange={handleNewPasswordChange}
        />
        <div
          className="password-toggle"
          onClick={() => toggleShowPassword("new")}
        >
          {showNewPassword ? <ShowPasswordIcon /> : <HidePasswordIcon />}
          {/* Toggle icon based on visibility state */}
        </div>
      </div>
      <div className="change-password-input">
        <input
          type={showConfirmPassword ? "text" : "password"} // Change type based on visibility state
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
        />
        <div
          className="password-toggle"
          onClick={() => toggleShowPassword("confirm")}
        >
          {showConfirmPassword ? <ShowPasswordIcon /> : <HidePasswordIcon />}
          {/* Toggle icon based on visibility state */}
        </div>
        {error && <p className="error">{error}</p>}
      </div>
      <button onClick={handleSubmit}>Save</button>
    </div>
  );

  return (
    <div className="pcfcp">
      <div className="header">
        <div className="moveBack" onClick={goBack}>
          <MoveBackIcon />
        </div>
      </div>
      <div className="change-password-container">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>
    </div>
  );
};

export default ChangePassword;
