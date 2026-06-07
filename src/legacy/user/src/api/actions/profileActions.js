import { createAsyncThunk } from "@reduxjs/toolkit";
import { getToken } from "../../utils/CommonUtils";
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

export const getUserProfileData = createAsyncThunk(
  "getUserProfileData",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/get_user_profile_data.php?user_id=${userId}`
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
      console.error("Error in fetchUserProfile:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfileData = createAsyncThunk(
  "updateUserProfileData",
  async (userProfileData, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/update_profile_data.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userProfileData),
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
      console.error("Error in updateUserProfile:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfilePic = createAsyncThunk(
  "updateProfilePicture",
  async ({ userId, formData }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env}fyp-rrh-backend-folder/riderentalhub-Backend/update_profile_picture.php`,
        {
          method: "POST",
          body: formData,
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

// export const createAward = createAsyncThunk(
//   "createAward",
//   async (payload, { rejectWithValue }) => {
//     try {
//       const formData = new FormData();
//       formData.append("text", payload?.text);
//       formData.append("files", payload?.files);

//       const response = await axios.post(`https://xyz.com/awards`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: "Bearer " + getToken(),
//         },
//       });

//       return response.data;
//     } catch (error) {
//       // return custom error message from backend if present
//       if (error.response && error.response.data.message) {
//         return rejectWithValue(error.response.data.message);
//       } else {
//         return rejectWithValue(error.message);
//       }
//     }
//   }
// );

// export const updateAward = createAsyncThunk(
//   "updateAward",
//   async (awardData, { rejectWithValue }) => {
//     try {
//       const formData = new FormData();
//       formData.append("text", awardData?.text);

//       if (awardData.hasOwnProperty("files")) {
//         formData.append("files", awardData?.files);
//       }

//       const response = await axios.put(
//         `https://xyz.com/awards/${awardData?._id}`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: "Bearer " + getToken(),
//           },
//         }
//       );

//       return response.data;
//     } catch (error) {
//       // return custom error message from backend if present
//       if (error.response && error.response.data.message) {
//         return rejectWithValue(error.response.data.message);
//       } else {
//         return rejectWithValue(error.message);
//       }
//     }
//   }
// );

// export const deleteAward = createAsyncThunk(
//   "deleteAward",
//   async (awardId, { rejectWithValue }) => {
//     try {
//       const response = await fetch(`https://xyz.com/awards/${awardId}`, {
//         ...config,
//         method: "DELETE",
//         headers: { ...config.headers, Authorization: "Bearer " + getToken() },
//       });
//       return response.json(); // parses JSON response into native JavaScript objects
//     } catch (error) {
//       // return custom error message from backend if present
//       if (error.response && error.response.data.message) {
//         return rejectWithValue(error.response.data.message);
//       } else {
//         return rejectWithValue(error.message);
//       }
//     }
//   }
// );
