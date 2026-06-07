import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import authSlice from "./reducerSlices/authSlice";
import homeSlice from "./reducerSlices/homeSlice";
import profileSlice from "./reducerSlices/profileSlice";
import userActivitySlice from "./reducerSlices/userActivitySlice";
import auctionSlice from "./reducerSlices/auctionSlice";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const rootReducer = combineReducers({
  auth: authSlice,
  homeSlice: homeSlice,
  profileSlice: profileSlice,
  userActivitySlice: userActivitySlice,
  auctionSlice: auctionSlice,
});

// Configuration for Redux-persist to persist specific parts of the Redux store
const persistConfig = {
  key: "root", // Key for the persisted state in storage
  storage, // Storage engine (e.g., localStorage)
  safelist: rootReducer, // Array of reducers to persist (only 'auth' in this case)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
});

export default store;
