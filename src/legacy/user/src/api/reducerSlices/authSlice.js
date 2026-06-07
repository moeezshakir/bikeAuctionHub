import { createSlice } from "@reduxjs/toolkit";
import {
  loginUser,
  registerUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
  resendOTP,
} from "../actions/authActions";
import { deleteToken, setToken } from "../../utils/CommonUtils";

const initialState = {
  status: "idle",
  error: "",
  message: "",
  authenticated: false,
  authenticatedStatus: "",
  yourotp: "",
  user_idfr: "",
  emailfreg: "",
  emailfrs: "",
  user: {},
  data: {},
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser(state) {
      deleteToken();
      Object.assign(state, initialState);
    },
    resetError: (state) => {
      state.status = "idle";
      state.error = "";
      state.authenticated = false;
      // state.message = "";
    },
    resetError2: (state) => {
      state.status = "idle";
      state.error = "";
      state.message = "";
    },
    resetatStatus: (state) => {
      state.status = "idle";
      state.error = "";
      state.authenticated = false;
      // state.message = "";
      state.authenticatedStatus = "";
      // state.yourotp = "";
      // state.user_idfr = "";
      // state.emailfrs = "";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { status, data, userEmail } = action.payload;
        if (status === true) {
          if (data.isEmailVerified === true) {
            state.authenticated = true;
            state.status = "succeeded";
            state.user = data;
          } else {
            state.authenticated = false;
            state.status = "failed";
            state.error = "Email is not verified";
          }
        } else {
          state.authenticated = false;
          state.status = "failed";
          state.error = action.payload.error || "Login failed"; // Adjust error handling as per backend response
          state.emailfreg = userEmail;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authenticated = false;
        state.status = "failed";
        state.error = action.payload || "Login rejected"; // Adjust error handling as per rejection payload
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const { status, otp, uidfr, userEmail } = action.payload;
        if (status === true) {
          console.log(action.payload);
          state.authenticated = true;
          state.status = "succeeded";
          state.authenticatedStatus = "registration";
          state.yourotp = otp;
          state.user_idfr = uidfr;
          state.emailfreg = userEmail;
          console.log(otp);
          console.log(state.yourotp);
        } else {
          state.authenticated = false;
          state.status = "failed";
          state.error = action.payload.error;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.authenticated = false;
        state.status = "failed";
        state.error = action.payload.error;
        console.log(action.payload);
      })
      .addCase(verifyOTP.pending, (state) => {
        state.status = "loading";
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        const { status, message } = action.payload;
        if (status === true) {
          state.status = "succeeded";
          state.message = message;
          state.authenticated = true;
        } else {
          state.status = "failed";
          state.error = action.payload.message;
        }
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(resendOTP.pending, (state) => {
        state.status = "loading";
      })
      .addCase(resendOTP.fulfilled, (state, action) => {
        const { status, message, otp, user_id } = action.payload;
        if (status === true) {
          state.status = "succeeded";
          state.authenticatedStatus = "registration";
          state.yourotp = otp;
          state.user_idfr = user_id;
        } else {
          state.status = "failed";
          state.error = action.payload.message || action.payload.error;
        }
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.error;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.status = "loading";
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        const { status, message, email_frs } = action.payload;
        if (status === true) {
          state.status = "succeeded";
          state.message = message;
          state.authenticated = true;
          state.authenticatedStatus = "forgotPassword";
          state.emailfrs = email_frs;
          console.log(email_frs);
        } else {
          state.status = "failed";
          state.error = action.payload.message;
        }
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = "loading";
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        const { status, message } = action.payload;
        if (status === true) {
          state.status = "succeeded";
          state.message = message;
          state.authenticated = true;
        } else {
          state.status = "failed";
          state.error = action.payload.message;
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logoutUser, resetError, resetError2, resetatStatus } =
  authSlice.actions;
export default authSlice.reducer;
