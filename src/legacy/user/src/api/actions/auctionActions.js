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

export const createAuctionSlot = createAsyncThunk(
  "createAuctionSlot",
  async ({ userId, slotDetails, images }, { rejectWithValue }) => {
    try {
      console.log(slotDetails);
      console.log(images);
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("highestPrice", slotDetails.highestPrice);
      formData.append("lowestPrice", slotDetails.lowestPrice);
      formData.append("duration", slotDetails.duration);

      images.forEach((image, index) => {
        console.log(`Appending image_${index + 1}:`, image);
        formData.append(`image_${index + 1}`, image);
      });

      const response = await fetch(
        "http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/create_auction_slot.php",
        {
          method: "POST",
          body: formData,
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

export const fetchAcceptedAuctionData = createAsyncThunk(
  "fetchAcceptedAuctionData",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/run_user_auction.php?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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

export const fetchOtherUserAuctionData = createAsyncThunk(
  "fetchOtherUserAuctionData",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost/fyp-rrh-backend-folder/riderentalhub-Backend/run_other_user_auction.php?userId=${userId}`,
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
