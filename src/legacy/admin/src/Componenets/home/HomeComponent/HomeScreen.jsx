import React, { useState, useEffect } from "react";
import NavigationComponent from "../NavigationComponent/NavigationTabs";
import RentalProcessActivity from "./rentalProcessActivity";
import AuctionProcessActivity from "./auctionProcessActivity";
import ReportAnIssue from "./ReportAnIssue";

////////////////////
import { APP_ROUTES } from "../../../utils/AppConstants";
import { logoutUser } from "../../../api/reducerSlices/authSlice";
import { useDispatch } from "react-redux";
import ListIcon from "../../../assets/svgs/ListIcon";
import XIcon from "../../../assets/svgs/XIcon";
import LogoutConfirmatiom from "../../popup-boxes/LogoutConfirmatiom";
require("./HomeCSS/home.css");
require("./HomeCSS/homeConstantsCSS.css");

const HomeScreen = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("activeTab") || "bikesrental"
  );
  // const [activeTabForNav, setActiveTabForNav] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResponsive, setIsResponsive] = useState(window.innerWidth < 748);
  const [logoutConfirmStatus, setLogoutConfirmStatus] = useState(false);

  useEffect(() => {
    if (activeTab === "logout") {
      localStorage.setItem("activeTab", APP_ROUTES.Rental_Process_Route);
    } else {
      localStorage.setItem("activeTab", activeTab);
    }
  }, [activeTab]);

  const handleNavigation = (page) => {
    setActiveTab(page);
  };

  const ifUserWantLogout = () => {
    setLogoutConfirmStatus(false);
    dispatch(logoutUser());
    localStorage.setItem("activeTab", APP_ROUTES.Rental_Process_Route);
    localStorage.setItem("isActiveTab", "bikesrental");
  };

  const logoutConfirmationUiToggle = () => {
    setLogoutConfirmStatus(!logoutConfirmStatus);
  };

  const renderMainComponent = () => {
    switch (activeTab) {
      case APP_ROUTES.Rental_Process_Route:
        return <RentalProcessActivity />;
      case APP_ROUTES.Auction_Process_Route:
        return <AuctionProcessActivity />;
      case APP_ROUTES.ReportAnIssue_Route:
        return <ReportAnIssue />;
      default:
        return <RentalProcessActivity />;
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsResponsive(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call on initial render

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    if (isResponsive) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {logoutConfirmStatus && (
        <LogoutConfirmatiom
          onConfirm={ifUserWantLogout}
          onCancel={logoutConfirmationUiToggle}
        />
      )}
      <div className={"mainContainer"}>
        <div className={`sidebar ${isSidebarOpen ? "sidebarOpen" : ""}`}>
          <div className="navCloseBox">
            <div className="navBarClose" onClick={handleCloseSidebar}>
              <XIcon />
            </div>
          </div>
          <NavigationComponent
            onNavigate={handleNavigation}
            setSidebar={handleCloseSidebar}
            logoutLayout={logoutConfirmationUiToggle}
            // activeTabForNav={activeTabForNav}
            // setActiveTabForNav={setActiveTabForNav}
          />
        </div>
        <div className="componentContainer">
          <div className="navbarline">
            <div className="navBarOpen" onClick={handleOpenSidebar}>
              <ListIcon />
            </div>
          </div>
          {renderMainComponent()}
        </div>
      </div>
    </>
  );
};

export default HomeScreen;
