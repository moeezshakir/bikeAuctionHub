import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./sidebar.css";
import { APP_ROUTES } from "../../../utils/AppConstants";
import HouseIcon from "../../../assets/svgs/HouseIcon";
import DashboardIocn from "../../../assets/svgs/DashboardIocn";
import ProfileIcon from "../../../assets/svgs/ProfileIcon";
import BikeIcon from "../../../assets/svgs/BikeIcon";
import AuctionIcon from "../../../assets/svgs/AuctionIcon";
import WalletIcon from "../../../assets/svgs/WalletIcon";
import SettingsIcon from "../../../assets/svgs/SettingsIcon";
import LogoutIcon from "../../../assets/svgs/LogoutIcon";

import { useDispatch } from "react-redux";
import { resetAllOnLogout } from "../../../utils/CommonUtils";

const Sidebar = ({
  closeSideBar,
  tileClickedForLogout,
  profileTabActiveNow,
  setProfileTabActiveNow,
  logoutFromUM,
  setLogoutFromUM,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const items = [
    { name: "Home", icon: <HouseIcon />, route: APP_ROUTES.HOME_ROUTE },
    {
      name: "Dashboard",
      icon: <DashboardIocn />,
      route: APP_ROUTES.DASHBOARD_ROUTE,
    },
    { name: "Profile", icon: <ProfileIcon />, route: APP_ROUTES.PROFILE_ROUTE },
    { name: "On Ride", icon: <BikeIcon />, route: APP_ROUTES.ON_RIDE_ROUTE },
    {
      name: "Open Auction",
      icon: <AuctionIcon />,
      route: APP_ROUTES.OPEN_AUCTION_ROUTE,
    },
    { name: "Wallet", icon: <WalletIcon />, route: APP_ROUTES.WALLET_ROUTE },
    {
      name: "Settings",
      icon: <SettingsIcon />,
      route: APP_ROUTES.SETTING_ROUTE,
    },
    { name: "Logout", icon: <LogoutIcon />, route: APP_ROUTES.SIGN_IN_ROUTE },
  ];

  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    let paramTabIndex = parseInt(urlParams.get("tab"));
    const savedTabIndex = localStorage.getItem("activeTabIndex");
    if (
      isNaN(paramTabIndex) ||
      paramTabIndex < 0 ||
      paramTabIndex >= items.length
    ) {
      paramTabIndex = undefined;
    }
    return paramTabIndex !== undefined
      ? paramTabIndex
      : savedTabIndex
      ? parseInt(savedTabIndex)
      : 0;
  });

  useEffect(() => {
    localStorage.setItem("activeTabIndex", activeTabIndex);
  }, [activeTabIndex]);

  const logoutProcess = () => {
    resetAllOnLogout(dispatch);
  };

  useEffect(() => {
    if (tileClickedForLogout) {
      setActiveTabIndex(0);
      localStorage.setItem("activeTabIndex", 0);
      logoutProcess();
      navigate(APP_ROUTES.SIGN_IN_ROUTE);
    }
  }, [tileClickedForLogout, navigate]);

  useEffect(() => {
    if (profileTabActiveNow) {
      setProfileTabActiveNow(false);
      const profileTabIndex = items.findIndex(
        (item) => item.route === APP_ROUTES.PROFILE_ROUTE
      );
      if (profileTabIndex !== -1) {
        setActiveTabIndex(profileTabIndex);
        navigate(APP_ROUTES.PROFILE_ROUTE);
      }
    }
  }, [profileTabActiveNow, items, setProfileTabActiveNow, navigate]);

  useEffect(() => {
    if (logoutFromUM) {
      setLogoutFromUM(false);
      const lastActiveTabIndex = localStorage.getItem("lastActiveTabIndex");
      setActiveTabIndex(lastActiveTabIndex ? parseInt(lastActiveTabIndex) : 0);
      logoutProcess();
      navigate(APP_ROUTES.SIGN_IN_ROUTE);
      localStorage.setItem("activeTabIndex", 0);
    }
  }, [logoutFromUM, navigate]);

  // Ensure the navigation reflects the restored activeTabIndex on component mount
  useEffect(() => {
    if (location.pathname !== items[activeTabIndex].route) {
      navigate(`${items[activeTabIndex].route}?tab=${activeTabIndex}`);
    }
  }, [activeTabIndex, navigate, items, location.pathname]);

  const onTabSelected = (index) => {
    if (index !== activeTabIndex) {
      setActiveTabIndex(index);
      navigate(`${items[index].route}?tab=${index}`);
    }
    closeSideBar();
  };

  return (
    <div className="items">
      {items.map((item, index) => (
        <Link
          key={item.name}
          to={`${item.route}?tab=${index}`}
          className={index === activeTabIndex ? "active" : ""}
          onClick={() => onTabSelected(index)}
        >
          <div className="itemIcon">{item.icon}</div>
          <p className="itemName">{item.name}</p>
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;
