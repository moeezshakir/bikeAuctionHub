import React, { useState, useEffect } from "react";
// import Artboard_icon from "../../../assets/images/Artboard.png";
import ProfilePic from "../../../assets/images/Ellipse.png";
import "../HomeComponent/HomeCSS/homeConstantsCSS.css";
// import SearchIcon from "../../../assets/svgs/SearchIcon";
import sideNavItems from "../../../utils/json/TabsList.json";
// import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../utils/AppConstants";
// import { useDispatch, useSelector } from "react-redux";
require("./nav.css");

const NavigationComponent = ({
  onNavigate,
  setSidebar,
  logoutLayout,
  // activeTabForNav,
  // setActiveTabForNav,
}) => {
  // const dispatch = useDispatch();
  // const navigate = useNavigate();
  const [isActiveTab, setActiveTab] = useState(
    () => localStorage.getItem("isActiveTab") || sideNavItems[0].slug
  );

  useEffect(() => {
    if (isActiveTab === sideNavItems[3].slug) {
      localStorage.setItem("isActiveTab", sideNavItems[0].slug);
    } else {
      localStorage.setItem("isActiveTab", isActiveTab);
    }
  }, [isActiveTab]);

  const onTabSelected = (item) => {
    if (item === sideNavItems[3].slug) {
      logoutLayout();
    }
    if (
      localStorage.getItem("isActiveTab") &&
      localStorage.getItem("isActiveTab") === item
    ) {
      window.location.reload();
    } else {
      setSidebar();
      setActiveTab(item);
      switch (item) {
        case sideNavItems[0].slug:
          onNavigate(APP_ROUTES.Rental_Process_Route);
          break;
        case sideNavItems[1].slug:
          onNavigate(APP_ROUTES.Auction_Process_Route);
          break;
        case sideNavItems[2].slug:
          onNavigate(APP_ROUTES.ReportAnIssue_Route);
          break;
        default:
      }
    }
  };

  // useEffect(() => {
  //   if (activeTabForNav === true) {
  //     setActiveTab(sideNavItems[1].slug);
  //     setActiveTabForNav(false);
  //   }
  // }, [activeTabForNav]);

  return (
    <>
      <div className="navigate">
        <div className="artboard">
          <span>
            <strong>Bike Auction </strong>HUB
          </span>
        </div>
        <div className="navLinks">
          <div className="firstLine">
            <ul>
              <li
                className={`${
                  isActiveTab === sideNavItems[0].slug && "active"
                }`}
                onClick={() => {
                  onTabSelected(sideNavItems[0].slug);
                }}
              >
                {sideNavItems[0].text}
              </li>
              <li
                className={`${
                  isActiveTab === sideNavItems[1].slug && "active"
                }`}
                onClick={() => {
                  onTabSelected(sideNavItems[1].slug);
                }}
              >
                {sideNavItems[1].text}
              </li>
              <li
                className={`${
                  isActiveTab === sideNavItems[2].slug && "active"
                }`}
                onClick={() => {
                  onTabSelected(sideNavItems[2].slug);
                }}
              >
                {sideNavItems[2].text}
              </li>
              <li
                className="false"
                onClick={() => {
                  logoutLayout();
                }}
              >
                {sideNavItems[3].text}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavigationComponent;
