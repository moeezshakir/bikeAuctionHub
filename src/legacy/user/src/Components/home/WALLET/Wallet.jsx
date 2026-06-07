import React, { useState, useEffect } from "react";
import Sidebar from "../../navAndSidebar/sidebar/sidebar";
import NavBar from "../../navAndSidebar/navBar/NavBar";
import Wallet2 from "./Wallet2";

const Wallet = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    localStorage.getItem("sidebarShrink") === "true" ? false : true
  );
  const [isResponsive, setIsResponsive] = useState(window.innerWidth < 899);
  const [profileTabActiveNow, setProfileTabActiveNow] = useState(false);
  const [logoutFromUM, setLogoutFromUM] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsResponsive(window.innerWidth <= 899);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call on initial render

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (localStorage.getItem("sidebarShrink") === "true") {
      localStorage.setItem("sidebarShrink", false);
    } else {
      localStorage.setItem("sidebarShrink", true);
    }
  };

  const handleCloseSidebar = () => {
    if (isResponsive) {
      setIsSidebarOpen(false);
      localStorage.setItem("sidebarShrink", true);
    }
  };

  const handleCloseSidebar1 = () => {
    if (isResponsive) {
      setIsSidebarOpen(false);
      localStorage.setItem("sidebarShrink", true);
    }
  };

  const setActiveTabProfile = () => {
    setProfileTabActiveNow(true);
  };

  const logOutUser = () => {
    setLogoutFromUM(true);
  };

  return (
    <div className="appContainer">
      <NavBar
        sidebarToggle={handleOpenSidebar}
        setSideBarCloseIfOpen={handleCloseSidebar}
        openProfileTab={setActiveTabProfile}
        logoutFuncInNav={logOutUser}
      />
      <div className="containerChild">
        <div className={`sidebar ${isSidebarOpen ? "sidebarShrink" : ""}`}>
          <Sidebar
            closeSideBar={handleCloseSidebar1}
            profileTabActiveNow={profileTabActiveNow}
            setProfileTabActiveNow={setProfileTabActiveNow}
            logoutFromUM={logoutFromUM}
            setLogoutFromUM={setLogoutFromUM}
          />
        </div>
        <div className="content-container">
          <Wallet2 />
        </div>
      </div>
    </div>
  );
};

export default Wallet;
