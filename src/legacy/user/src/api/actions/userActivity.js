import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { env } from "../../utils/env";

const config = {
  method: "POST", // *GET, POST, PUT, DELETE, etc.
  cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
  headers: {
    "Content-Type": "application/json",
    "Cross-Origin-Embedder-Policy": false,
    // "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QxQGdtYWlsLmNvbSIsInJvbGUiOiJyZWFsdG9yIiwiaWQiOiI2NTVjMmJiODMwNTU2OWRjYmVmOTM4MzAiLCJpYXQiOjE3MDczMDEzMDMsImV4cCI6MTczODgzNzMwM30.ki56OzG10bYOxk2VBPNgfakWBaTV7IfQItmisWY7wps"
    Authorization: "Bearer ",
  },
  redirect: "follow", // manual, *follow, error
  referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
};

const config2 = {
  method: "POST", // *GET, POST, PUT, DELETE, etc.
  cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
  headers: {
    "Content-Type": "multipart/form-data",
    "Cross-Origin-Embedder-Policy": false,
    Authorization: "Bearer ",
  },
  redirect: "follow", // manual, *follow, error
  referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
};

export const getUserRideHistory = createAsyncThunk(
  "getUserRideHistory",
  async (userId, { rejectWithValue }) => {
    try {
      //   console.log(userId);
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/get_ride_history.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }
        return data;
      } else {
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserRequiredInfo = createAsyncThunk(
  "updateUserRequiredInfo",
  async (userInfo, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/user_requiredInfo.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userInfo),
        }
      );

      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }
        return data;
      } else {
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getUserInfo = createAsyncThunk(
  "getUserInfo",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/get_user_requiredInfo.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(data.error || "Unknown error occurred");
        }
        return data;
      } else {
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
