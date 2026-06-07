import { createAsyncThunk } from "@reduxjs/toolkit";
import { getToken } from "../../utils/CommonUtils";
import { env } from "../../utils/env";
// import axios from "axios";

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

export const getStoresLocations = createAsyncThunk(
  "store/search",
  async (locationObject, { rejectWithValue }) => {
    try {
      const response = await fetch(`https://xyz.com/store/search`, {
        ...config,
        headers: { ...config.headers, Authorization: "Bearer " + getToken() },
        body: JSON.stringify(locationObject),
      });
      return response.json(); // parses JSON response into native JavaScript objects
    } catch (error) {
      // return custom error message from backend if present
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue(error.message);
      }
    }
  }
);

export const getStoreData = createAsyncThunk(
  "getStoreData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/get_stores_data.php`
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
      console.error("Error in fetchStoreData:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const getBikeData = createAsyncThunk(
  "bike/getBikeData",
  async (storeId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/get_store_bike_data.php?id=${storeId}`
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
      console.error("Error in fetchBikeData:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const reportIssue = createAsyncThunk(
  "issues/report",
  async (issueObject, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/report_issue.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(issueObject),
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
      console.error("Error in reportIssue:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const checkCurrentPassword = createAsyncThunk(
  "auth/checkCurrentPassword",
  async (passwordObject, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/check_current_password.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordObject),
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

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordObject, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/change_password.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordObject),
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

export const deleteAccount = createAsyncThunk(
  "deleteAccount",
  async (userIdObject, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/delete_account.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userIdObject),
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

export const getWalletBalance = createAsyncThunk(
  "getWalletBalance",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/get_wallet_balance.php`,
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
        return data.data;
      } else {
        throw new Error("Unexpected response: " + responseText);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const rechargeWallet = createAsyncThunk(
  "rechargeWallet",
  async (object, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/wallet_recharge.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(object),
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

export const bookBike = createAsyncThunk(
  "bookBike",
  async (bookingDetails, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/book_bikes.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingDetails),
        }
      );

      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(data.message || "Unknown error occurred");
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

export const checkBookedBike = createAsyncThunk(
  "checkBookedBike",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/check_booked_bikes.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }), // Assuming userId is passed as an argument
        }
      );

      const contentType = response.headers.get("content-type");
      const responseData = await response.json();

      if (response.ok) {
        return responseData; // Return data if response is OK
      } else {
        throw new Error(responseData.message || "Failed to check booked bikes");
      }
    } catch (error) {
      throw new Error(error.message || "Failed to fetch data");
    }
  }
);

export const getRideLocations = createAsyncThunk(
  "ridePlaces/getRideLocations",
  async (storeId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/get_ride_locations.php?storeId=${storeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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
