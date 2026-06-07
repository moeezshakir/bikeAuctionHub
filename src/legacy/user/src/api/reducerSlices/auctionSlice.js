import { createSlice } from "@reduxjs/toolkit";
import {
  createAuctionSlot,
  fetchAcceptedAuctionData,
  fetchOtherUserAuctionData,
} from "../actions/auctionActions";

const initialState = {
  status: "idle",
  error: "",
  auctionCreated: "",
  userAuctionData: null,
  otherUserAuctionData: null,
};

const auctionSlice = createSlice({
  name: "auctionSlice",
  initialState,
  reducers: {
    resetState: (state) => {
      state.status = "";
      state.error = "";
      state.auctionCreated = "";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(createAuctionSlot.pending, (state) => {
        state.status = "loading";
        state.auctionCreated = false;
      })
      .addCase(createAuctionSlot.fulfilled, (state, action) => {
        if (action.payload.status === true) {
          state.status = "succeeded";
          state.auctionCreated = "created";
        }
      })
      .addCase(createAuctionSlot.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.error;
        state.auctionCreated = "failed";
      })
      .addCase(fetchAcceptedAuctionData.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchAcceptedAuctionData.fulfilled, (state, action) => {
        state.status = "succeeded";
        console.log(action.payload?.auctionData);
        state.userAuctionData = action.payload.auctionData;
      })
      .addCase(fetchAcceptedAuctionData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchOtherUserAuctionData.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchOtherUserAuctionData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.otherUserAuctionData = action.payload.auctionData;
      })
      .addCase(fetchOtherUserAuctionData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetState } = auctionSlice.actions;

export default auctionSlice.reducer;
