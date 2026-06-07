"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import userStore from "@/legacy/user/src/api/store";
import adminStore from "@/legacy/admin/src/api/store";

const userPersistor = persistStore(userStore);
const adminPersistor = persistStore(adminStore);

export function UserLegacyProviders({ children }) {
  return (
    <Provider store={userStore}>
      <PersistGate loading={null} persistor={userPersistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}

export function AdminLegacyProviders({ children }) {
  return (
    <Provider store={adminStore}>
      <PersistGate loading={null} persistor={adminPersistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}