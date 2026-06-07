export const setToken = (token) => {
  localStorage.setItem("userToken", token);
};

export const getToken = () => {
  const userToken = localStorage.getItem("userToken");
  if (userToken !== null && userToken !== undefined) {
    return localStorage.getItem("userToken");
  }
};

export const deleteToken = () => {
  localStorage.removeItem("token");
};
