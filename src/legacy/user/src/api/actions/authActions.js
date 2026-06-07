import { createAsyncThunk } from "@reduxjs/toolkit";
import { env } from "../../utils/env";

const config = {
  method: "POST", // *GET, POST, PUT, DELETE, etc.
  cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
  headers: {
    "Content-Type": "application/json",
    // "Cross-Origin-Embedder-Policy": false,
  },
  redirect: "follow", // manual, *follow, error
  referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userObject, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/register.php`,
        {
          ...config,
          body: JSON.stringify(userObject),
        }
      );

      console.log("Raw response:", response);

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        console.log("Parsed JSON data:", data);

        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }
        return data;
      } else {
        console.error("Unexpected response:", responseText);
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      console.error("Error in registerUser:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (otpObject, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/otp_verification.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(otpObject),
        }
      );

      console.log("Raw response:", response);

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        console.log("Parsed JSON data:", data);

        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }
        return data;
      } else {
        console.error("Unexpected response:", responseText);
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      console.error("Error in verifyOTP:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async (email, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/resend_otp.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }

        return data;
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Error in resendOTP:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/login.php`,
        {
          ...config,
          body: JSON.stringify(credentials),
        }
      );

      console.log("Raw response:", response);

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        console.log("Parsed JSON data:", data);

        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }
        return data;
      } else {
        console.error("Unexpected response:", responseText);
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      console.error("Error in loginUser:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (emailObject, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/forgot_password.php`,
        {
          ...config,
          body: JSON.stringify(emailObject),
        }
      );

      console.log("Raw response:", response);

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        console.log("Parsed JSON data:", data);

        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }
        return data;
      } else {
        console.error("Unexpected response:", responseText);
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (passwordObject, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/resetPassword.php`,
        {
          ...config,
          body: JSON.stringify(passwordObject),
        }
      );

      console.log("Raw response:", response);

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        console.log("Parsed JSON data:", data);

        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }
        return data;
      } else {
        console.error("Unexpected response:", responseText);
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return rejectWithValue(error.message);
    }
  }
);
