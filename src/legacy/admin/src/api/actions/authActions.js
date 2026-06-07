// import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getToken } from "../../utils/CommonUtils";

const config = {
  method: "POST", // *GET, POST, PUT, DELETE, etc.
  cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
  headers: {
    "Content-Type": "application/json",
  },
  redirect: "follow", // manual, *follow, error
  referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
};

export const signinUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/admin_login.php`,
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

export const loadReportedIssues = createAsyncThunk(
  "loadReportedIssues",
  async (data, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/get_report_issues_data.php`,
        {
          ...config,
          method: "GET",
          headers: { ...config.headers },
        }
      );
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

export const fetchBikeDetails = createAsyncThunk(
  "bikes/fetchBikeDetails",
  async (storeId, { rejectWithValue }) => {
    console.log("store id :", storeId);

    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/get_rental_bike_data_for_admin.php?storeId=${storeId}`
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
      console.error("Error in fetchBikeDetails:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateBikeDetails = createAsyncThunk(
  "bikes/updateBikeDetails",
  async (objectToSend, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/update_bike_details.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(objectToSend),
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

export const addNewBike = createAsyncThunk(
  "bikes/addNewBike",
  async (objectToSend, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/add_new_bike.php`,
        {
          method: "POST",
          body: objectToSend,
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

export const deleteBikeCell = createAsyncThunk(
  "deleteBikeCell",
  async (objectToSend, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/delete_bike_cell.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(objectToSend),
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

export const updateRideDetails = createAsyncThunk(
  "updatRideDetails",
  async (objectToSend, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/inset_or_update_ride_places.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(objectToSend),
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

export const getRideLocations = createAsyncThunk(
  "getRideLocations",
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

export const finishRide = createAsyncThunk(
  "finishRide",
  async (objectToSend, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/finish_ride_By_Admin.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(objectToSend),
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

export const getAuctionData = createAsyncThunk(
  "getAuctionData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        "http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/get_pending_auctions_slots.php",
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

export const updateAuctionStatus = createAsyncThunk(
  "updateAuctionStatus",
  async ({ id, userId, status }, { rejectWithValue }) => {
    try {
      console.log("hello", { id, userId, status });
      const response = await fetch(
        "http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/apply_auction_status.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, userId, status }),
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
      console.error("Error in insertAuctionSlot:", error);
      return rejectWithValue(error.message);
    }
  }
);
