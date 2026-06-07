const defaultProfile = {
  name: "",
  image: "",
  email: "",
  phoneNumber: "",
  address: "",
  nationality: "",
  languages: "",
  socialLinks: null,
  awards: [],
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const data = contentType.includes("application/json") && text ? JSON.parse(text) : null;

  if (!response.ok || (data && data.status === false)) {
    const base = data?.error || data?.message || "Request failed";
    const details = data?.details ? `: ${data.details}` : "";
    throw new Error(`${base}${details}`);
  }

  return data;
}

export async function loginUser(credentials) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return {
    session: {
      user_id: data?.data?.user_id,
      email: credentials.email,
      profile_pic: data?.data?.profile_pic || "",
    },
    message: data?.message || "Login successful.",
  };
}

export async function loginAdmin(credentials) {
  const data = await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return {
    session: {
      user_id: data?.data?.user_id,
      store_id: data?.data?.store_id,
      email: credentials.email,
    },
    message: data?.message || "Login successful.",
  };
}

export async function registerUser(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name: payload.username || payload.name,
      username: payload.username,
      email: payload.email,
      password: payload.password,
    }),
  });
}

export async function requestPasswordReset(payload) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getUserProfile(userId) {
  try {
    const data = await request(`/api/users/${userId}/profile`);
    return data.data || defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export async function updateUserProfile(userId, payload) {
  const data = await request(`/api/users/${userId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function getStores() {
  try {
    const data = await request("/api/stores");
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getStoreBikes(storeId) {
  try {
    const data = await request(`/api/stores/${storeId}/bikes`);
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getWalletBalance(userId) {
  try {
    const data = await request(`/api/users/${userId}/wallet`);
    return data.data || { user_id: userId, remainingBalance: 0 };
  } catch {
    return { user_id: userId, remainingBalance: 0 };
  }
}

export async function rechargeWallet(userId, amount) {
  const data = await request(`/api/users/${userId}/wallet`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

  return data.data;
}

export async function getRideHistory(userId) {
  try {
    const data = await request(`/api/users/${userId}/rides`);
    return data.data || [];
  } catch {
    return [];
  }
}

export async function bookRide(userId, payload) {
  return request(`/api/users/${userId}/rides`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAuctionSlots() {
  try {
    const data = await request("/api/auctions");
    return data.auctionData || [];
  } catch {
    return [];
  }
}

export async function getAuctionSlotsByFilter({ status = "all", userId, scope = "all" } = {}) {
  try {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (userId) params.set("userId", String(userId));
    if (scope) params.set("scope", scope);
    const data = await request(`/api/auctions?${params.toString()}`);
    return data.auctionData || [];
  } catch {
    return [];
  }
}

export async function placeAuctionBid(payload) {
  const data = await request("/api/auctions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data.data;
}

export async function createAuctionSlot(payload) {
  if (payload instanceof FormData) {
    const data = await request("/api/auctions", {
      method: "PUT",
      body: payload,
    });
    return data.data;
  }
  const data = await request("/api/auctions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function reviewAuctionSlot(payload) {
  const data = await request("/api/auctions", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data.data;
}

export async function auctionAction(payload) {
  const data = await request("/api/auctions", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data.data;
}

export async function deleteAuctionData(auctionId, confirmText = "DELETE") {
  const data = await request("/api/auctions", {
    method: "PATCH",
    body: JSON.stringify({
      auction_id: auctionId,
      action: "purge",
      confirm: confirmText,
    }),
  });

  return data;
}

export async function getSuccessfulAuctions() {
  try {
    const data = await request("/api/auctions?report=success");
    return data.auctionData || [];
  } catch {
    return [];
  }
}

export async function finishRideByAdmin(payload) {
  return request("/api/admin/rides/finish", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getNotifications({ role, userId, storeId, limit = 25 }) {
  const params = new URLSearchParams({ role, limit: String(limit) });
  if (userId) params.set("userId", String(userId));
  if (storeId) params.set("storeId", String(storeId));
  const data = await request(`/api/notifications?${params.toString()}`);
  return data;
}

export async function markNotificationsRead(payload) {
  return request("/api/notifications", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getUserActivity(userId) {
  const data = await request(`/api/activities/user/${userId}`);
  return data.data || [];
}

export async function getAdminActivity(storeId) {
  const data = await request(`/api/activities/admin?storeId=${storeId}`);
  return data.data || [];
}

export async function getReportedIssues() {
  try {
    const data = await request("/api/issues");
    return data.data || [];
  } catch {
    return [];
  }
}

export async function submitIssue(payload) {
  return request("/api/issues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateIssueStatus(payload) {
  const data = await request("/api/issues", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data.data;
}

export async function updateUserPassword(userId, payload) {
  return request(`/api/users/${userId}/password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminFleet(storeId) {
  try {
    const data = await request(`/api/admin/fleet?storeId=${storeId}`);
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getRidePlaces(storeId) {
  try {
    const data = await request(`/api/stores/${storeId}/ride-places`);
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getPlatformSettings() {
  try {
    const data = await request("/api/settings");
    return (
      data.data || {
        platform_fee_percent: 0.3,
        seller_fee_percent: 5,
        buyer_fee_percent: 0.3,
        bid_deposit_amount: 500,
        payment_bank_name: "HBL",
        payment_account_title: "Bike Auction Platform",
        payment_account_number: "1234567890123",
        payment_iban: "PK36HABB0023456789012345",
        payment_instructions:
          "Transfer the full winning bid plus platform fee. Use your auction number as the payment reference. Then tap I paid online in the Won tab.",
        payment_bank_accounts: [
          {
            id: "account_1",
            label: "HBL Main",
            bank_name: "HBL",
            account_title: "Bike Auction Platform",
            account_number: "1234567890123",
            iban: "PK36HABB0023456789012345",
            enabled: true,
          },
          { id: "account_2", label: "Bank option 2", bank_name: "", account_title: "", account_number: "", iban: "", enabled: false },
          { id: "account_3", label: "Bank option 3", bank_name: "", account_title: "", account_number: "", iban: "", enabled: false },
        ],
        auction_request_fields: [],
      }
    );
  } catch {
    return {
      platform_fee_percent: 0.3,
      seller_fee_percent: 5,
      buyer_fee_percent: 0.3,
      bid_deposit_amount: 500,
      payment_bank_name: "HBL",
      payment_account_title: "Bike Auction Platform",
      payment_account_number: "1234567890123",
      payment_iban: "PK36HABB0023456789012345",
      payment_instructions:
        "Transfer the full winning bid plus platform fee. Use your auction number as the payment reference. Then tap I paid online in the Won tab.",
      payment_bank_accounts: [
        {
          id: "account_1",
          label: "HBL Main",
          bank_name: "HBL",
          account_title: "Bike Auction Platform",
          account_number: "1234567890123",
          iban: "PK36HABB0023456789012345",
          enabled: true,
        },
        { id: "account_2", label: "Bank option 2", bank_name: "", account_title: "", account_number: "", iban: "", enabled: false },
        { id: "account_3", label: "Bank option 3", bank_name: "", account_title: "", account_number: "", iban: "", enabled: false },
      ],
      auction_request_fields: [],
    };
  }
}

export async function updatePlatformSettings(payload) {
  const data = await request("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function getAuctionCategories() {
  try {
    const data = await request("/api/categories");
    return data.data || [];
  } catch {
    return [];
  }
}

export async function createAuctionCategory(payload) {
  const data = await request("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function updateAuctionCategory(payload) {
  const data = await request("/api/categories", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function deactivateAuctionCategory(id) {
  return request(`/api/categories?id=${id}`, { method: "DELETE" });
}

export async function createStore(payload) {
  const data = await request("/api/stores", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function updateStore(payload) {
  const data = await request("/api/stores", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.data;
}
