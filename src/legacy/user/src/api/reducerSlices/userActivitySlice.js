import { createSlice } from "@reduxjs/toolkit";
import {
  getUserRideHistory,
  updateUserRequiredInfo,
  getUserInfo,
} from "../actions/userActivity";

const initialState = {
  status: "idle",
  error: "",
  getRideHistoryData: null,
  userInfoUpdStatus: false,
  userReqInfoData: null,
};

const userActivitySlice = createSlice({
  name: "userActivitySlice",
  initialState,
  reducers: {
    resetState: (state) => {
      state.status = "";
      state.error = "";
      state.getRideHistoryData = {};
      state.userInfoUpdStatus = false;
      state.userReqInfoData = null;
    },
    resetState2: (state) => {
      state.status = "";
      state.error = "";
      state.userInfoUpdStatus = false;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getUserRideHistory.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(getUserRideHistory.fulfilled, (state, action) => {
        console.log(action);
        if (action?.payload?.status === true) {
          state.status = "succeeded";
          console.log("suc");
          state.getRideHistoryData = action.payload.data;
        } else {
          state.status = "failed";
          state.error = action.payload.message;
          state.getRideHistoryData = null;
        }
      })
      .addCase(getUserRideHistory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.getRideHistoryData = null;
        console.log("fail");
      })
      .addCase(updateUserRequiredInfo.pending, (state, action) => {
        state.status = "loading";
        state.userInfoUpdStatus = false;
      })
      .addCase(updateUserRequiredInfo.fulfilled, (state, action) => {
        console.log(action);
        if (action?.payload?.status === true) {
          state.status = "succeeded";
          state.userInfoUpdStatus = true;
        } else {
          state.status = "failed";
          state.error = action.payload.message;
        }
      })
      .addCase(updateUserRequiredInfo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(getUserInfo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userReqInfoData = action.payload.data;
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch user info";
      });
  },
});

export const { resetState, resetState2 } = userActivitySlice.actions;

export default userActivitySlice.reducer;
