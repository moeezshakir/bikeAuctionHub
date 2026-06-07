// import { configureStore } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import authSlice from "./reducerSlices/authSlice";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const rootReducer = combineReducers({
  auth: authSlice,
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
