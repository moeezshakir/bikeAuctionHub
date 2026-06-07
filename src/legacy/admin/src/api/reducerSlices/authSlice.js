import { createSlice } from "@reduxjs/toolkit";
import {
  signinUser,
  loadReportedIssues,
  fetchBikeDetails,
  updateBikeDetails,
  addNewBike,
  deleteBikeCell,
  updateRideDetails,
  getRideLocations,
  finishRide,
  getAuctionData,
  updateAuctionStatus,
} from "../actions/authActions";

const initialState = {
  status: "idle",
  error: "",
  authenticated: false,
  user: {},
  contactedListData: null,
  reportedIssuesData: null,
  bikeDetails: null,
  bikeadded: false,
  bikeCellDelete: false,
  locationsUpdated: false,
  rideLocations: null,
  rideFinished: false,
  auctionData: null,
  auctionStatusApplied: false,
};

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser(state) {
      Object.assign(state, initialState);
    },
    resetError: (state) => {
      state.status = "idle";
      state.error = "";
      state.bikeadded = false;
      state.bikeCellDelete = false;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(signinUser.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(signinUser.fulfilled, (state, action) => {
        if (action.payload.status === true) {
          if (action.payload.data.isEmailVerified === true) {
            state.authenticated = true;
            state.status = "succeeded";
            state.user = action.payload.data;
          } else {
            state.authenticated = false;
            state.status = "failed";
            state.error = "Email is not verified";
          }
        } else {
          state.authenticated = false;
          state.status = "failed";
          state.error = action.payload.error;
          // console.log(action.payload);
        }
      })
      .addCase(signinUser.rejected, (state, action) => {
        state.authenticated = false;
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loadReportedIssues.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(loadReportedIssues.fulfilled, (state, action) => {
        if (action.payload.status === true) {
          state.status = "succeeded";
          state.reportedIssuesData = action.payload.data;
          console.log(action.payload);
        } else {
          state.status = "failed";
          state.error = action.payload.message;
          state.reportedIssuesData = null;
        }
      })
      .addCase(loadReportedIssues.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.reportedIssuesData = null;
      })
      .addCase(fetchBikeDetails.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBikeDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.bikeDetails = action.payload.data;
      })
      .addCase(fetchBikeDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateBikeDetails.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(updateBikeDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Update the bike details in state if needed
        // For example, find and update the specific bike in state.bikeDetails array
        state.error = null;
      })
      .addCase(updateBikeDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addNewBike.pending, (state) => {
        state.status = "loading";
        state.bikeadded = false;
      })
      .addCase(addNewBike.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.bikeadded = true;
        console.log(action.payload);
        // Append the new bike to state.bikeDetails if needed
        // For example, state.bikeDetails.push(action.payload);
        state.error = null;
      })
      .addCase(addNewBike.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteBikeCell.pending, (state, action) => {
        state.status = "loading";
        state.bikeCellDelete = false;
      })
      .addCase(deleteBikeCell.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.bikeCellDelete = true;
        console.log(action.payload);
        console.log("hello");
        state.error = null;
      })
      .addCase(deleteBikeCell.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateRideDetails.pending, (state, action) => {
        state.status = "loading";
        state.locationsUpdated = false;
      })
      .addCase(updateRideDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.locationsUpdated = true;
      })
      .addCase(updateRideDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(getRideLocations.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(getRideLocations.fulfilled, (state, action) => {
        state.status = "succeeded";
        console.log("hello", action.payload);
        if (action.payload?.status === true) {
          state.rideLocations = action.payload?.locations;
        }
      })
      .addCase(getRideLocations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(finishRide.pending, (state, action) => {
        state.status = "loading";
        state.rideFinished = false;
      })
      .addCase(finishRide.fulfilled, (state, action) => {
        state.status = "succeeded";
        console.log("hello", action.payload);
        if (action.payload?.status === true) {
          state.rideFinished = true;
        }
      })
      .addCase(finishRide.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(getAuctionData.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(getAuctionData.fulfilled, (state, action) => {
        state.status = "succeeded";
        console.log(action);
        if (action.payload?.status === true) {
          state.auctionData = action.payload?.auctionData;
          // console.log(action.payload);
        }
      })
      .addCase(getAuctionData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateAuctionStatus.pending, (state, action) => {
        state.status = "loading";
        state.auctionStatusApplied = false;
      })
      .addCase(updateAuctionStatus.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.auctionStatusApplied = true;
      })
      .addCase(updateAuctionStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logoutUser, resetError } = AuthSlice.actions;
export default AuthSlice.reducer;
