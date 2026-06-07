import { createSlice } from "@reduxjs/toolkit";
import {
  getUserProfileData,
  updateUserProfileData,
  updateProfilePic,
  // updateUserProfileImage,
  // createAward,
  // updateAward,
  // deleteAward,
} from "../actions/profileActions";

const initialState = {
  status: "idle",
  error: "",
  userprofileData: {},
  userprofileUpdated: false,
  userprofilePic: false,
  awardCreated: false,
  awardUpdated: false,
  awardDeleted: false,
};

const profileSlice = createSlice({
  name: "profileSlice",
  initialState,
  reducers: {
    resetState: (state) => {
      state.status = "";
      state.error = "";
      state.userprofileData = {};
      state.userprofileUpdated = false;
      state.userprofilePic = false;
      state.awardCreated = false;
      state.awardUpdated = false;
      state.awardDeleted = false;
    },
    resetawardState: (state) => {
      state.status = "";
      state.error = "";
      state.awardCreated = false;
      state.awardUpdated = false;
      state.awardDeleted = false;
    },
    resetError: (state) => {
      state.status = "idle";
      state.error = "";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getUserProfileData.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(getUserProfileData.fulfilled, (state, action) => {
        if (action.payload.status === true) {
          state.status = "succeeded";
          state.userprofileData = action.payload.data;
          console.log(state.userprofileData);
        } else {
          state.status = "failed";
          state.error = action.payload.message;
          state.userprofileData = null;
        }
      })
      .addCase(getUserProfileData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.userprofileData = null;
      })
      .addCase(updateUserProfileData.pending, (state, action) => {
        state.status = "loading";
        state.userprofileUpdated = false;
      })
      .addCase(updateUserProfileData.fulfilled, (state, action) => {
        if (action?.payload?.status === true) {
          state.status = "succeeded";
          state.userprofileUpdated = true;
          state.userprofileData = action?.payload?.data;
        } else {
          state.status = "failed";
          state.error = action?.payload?.message;
        }
      })
      .addCase(updateUserProfileData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.userprofileData = null;
      })
      .addCase(updateProfilePic.pending, (state, action) => {
        state.status = "loading";
        // state.userUpdateProfile = false;
      })
      .addCase(updateProfilePic.fulfilled, (state, action) => {
        if (action?.payload?.status === true) {
          state.status = "succeeded";
          state.userprofilePic = true;
        } else {
          state.status = "failed";
          state.error = action?.payload?.message;
          state.userprofilePic = false;
        }
      })
      .addCase(updateProfilePic.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.userprofilePic = false;
        // state.userprofileData = null;
      });
    // .addCase(updateUserProfileImage.pending, (state, action) => {
    //   state.status = "loading";
    // })
    // .addCase(updateUserProfileImage.fulfilled, (state, action) => {
    //   if (action.payload.status === true) {
    //     state.status = "succeeded";
    //     state.userprofileData = action.payload.data;
    //     state.userImageUpdate = true;
    //   } else {
    //     state.status = "failed";
    //     state.error = action.payload.message;
    //     state.userprofileData = null;
    //   }
    // })
    // .addCase(updateUserProfileImage.rejected, (state, action) => {
    //   state.status = "failed";
    //   state.error = action.payload;
    //   state.userprofileData = null;
    // })
    // .addCase(createAward.pending, (state, action) => {
    //   state.status = "loading";
    // })
    // .addCase(createAward.fulfilled, (state, action) => {
    //   state.status = "succeeded";
    //   state.awardCreated = true;
    // })
    // .addCase(createAward.rejected, (state, action) => {
    //   state.status = "failed";
    //   state.error = action.payload;
    //   state.awardCreated = false;
    // })
    // .addCase(updateAward.pending, (state, action) => {
    //   state.status = "loading";
    // })
    // .addCase(updateAward.fulfilled, (state, action) => {
    //   state.status = "succeeded";
    //   state.awardUpdated = true;
    // })
    // .addCase(updateAward.rejected, (state, action) => {
    //   state.status = "failed";
    //   state.error = action.payload;
    //   state.awardUpdated = false;
    // })
    // .addCase(deleteAward.pending, (state, action) => {
    //   state.status = "loading";
    // })
    // .addCase(deleteAward.fulfilled, (state, action) => {
    //   state.status = "succeeded";
    //   state.awardDeleted = true;
    // })
    // .addCase(deleteAward.rejected, (state, action) => {
    //   state.status = "failed";
    //   state.error = action.payload;
    //   state.awardDeleted = false;
    // })
  },
});

export const { resetState, resetawardState, resetError } = profileSlice.actions;

export default profileSlice.reducer;
