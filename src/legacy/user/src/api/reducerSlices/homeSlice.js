import { createSlice } from "@reduxjs/toolkit";
import {
  getStoresLocations,
  reportIssue,
  checkCurrentPassword,
  changePassword,
  deleteAccount,
  getStoreData,
  getBikeData,
  getWalletBalance,
  rechargeWallet,
  bookBike,
  checkBookedBike,
  getRideLocations,
} from "../actions/homeActions";

const initialState = {
  status: "idle",
  error: "",
  data: [],
  currentPasswordStatus: false,
  passwordChangeStatus: false,
  accountDeleted: false,
  storesData: [],
  bikesData: [],
  balance: null,
  bookingStatus: "",
  ridingStatus: "",
  rideLocations: "",
};

const homeSlice = createSlice({
  name: "homeSlice",
  initialState,
  reducers: {
    resetState: (state) => {
      state.status = "";
      state.error = "";
    },
    resetState2: (state) => {
      state.status = "";
      state.error = "";
      state.currentPasswordStatus = false;
      state.passwordChangeStatus = false;
      state.ridingStatus = false;
      state.bookingStatus = false;
    },
    resetStateOnLogout: (state) => {
      state.status = "";
      state.error = "";
      state.data = [];
      state.currentPasswordStatus = false;
      state.passwordChangeStatus = false;
      state.accountDeleted = false;
      state.storesData = [];
      state.bikesData = [];
      state.balance = null;
      state.bookingStatus = "";
      state.ridingStatus = "";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getStoresLocations.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(getStoresLocations.fulfilled, (state, action) => {
        if (action.payload.status === true) {
          if (action.payload.data.length > 0) {
            state.status = "succeeded";
            state.data = action.payload.data;
          } else {
            state.authenticated = false;
            state.status = "failed";
            state.error = "No records found";
            state.data = null;
          }
        } else {
          state.status = "failed";
          state.error = action.payload.message;
          state.data = null;
        }
      })
      .addCase(getStoresLocations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.data = null;
      })
      .addCase(reportIssue.pending, (state) => {
        state.status = "loading";
      })
      .addCase(reportIssue.fulfilled, (state, action) => {
        state.status = "succeeded";
        console.log(action.payload);
        // Optionally handle any additional state updates
      })
      .addCase(reportIssue.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(checkCurrentPassword.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkCurrentPassword.fulfilled, (state, action) => {
        const { status, message } = action.payload;
        if (status) {
          state.status = "succeeded";
          state.message = message;
          state.currentPasswordStatus = true;
        } else {
          state.status = "failed";
          state.error = action.payload.error;
        }
      })
      .addCase(checkCurrentPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.status = "loading";
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        const { status, message } = action.payload;
        if (status) {
          state.status = "succeeded";
          state.message = message;
          state.passwordChangeStatus = true;
        } else {
          state.status = "failed";
          state.error = action.payload.error;
        }
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteAccount.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.message = action.payload.message;
        state.accountDeleted = true;
        console.log("del");
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        console.log("notdel");
      })
      .addCase(getStoreData.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getStoreData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.storesData = action.payload.data;
      })
      .addCase(getStoreData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(getBikeData.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getBikeData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.bikesData = action.payload.data;
      })
      .addCase(getBikeData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(getWalletBalance.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getWalletBalance.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload.remainingBalance;
      })
      .addCase(getWalletBalance.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(rechargeWallet.pending, (state) => {
        state.status = "loading";
      })
      .addCase(rechargeWallet.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload.data.newBalance;
      })
      .addCase(rechargeWallet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(bookBike.pending, (state) => {
        state.status = "loading";
        state.bookingStatus = "";
      })
      .addCase(bookBike.fulfilled, (state, action) => {
        state.bookingStatus = "succeeded";
        // state.totalPrice = action.payload.totalPrice;
      })
      .addCase(bookBike.rejected, (state, action) => {
        state.bookingStatus = "failed";
        state.error = action.payload ? action.payload : "Failed to book bike";
      })
      .addCase(checkBookedBike.pending, (state) => {
        state.status = "loading";
        state.ridingStatus = "";
      })
      .addCase(checkBookedBike.fulfilled, (state, action) => {
        state.ridingStatus = "succeeded";
        console.log("hello");
      })
      .addCase(checkBookedBike.rejected, (state, action) => {
        state.ridingStatus = "failed";
        state.error = action.payload ? action.payload : "Failed to load";
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
      });
  },
});

export const { resetState, resetState2, resetStateOnLogout } =
  homeSlice.actions;

export default homeSlice.reducer;
