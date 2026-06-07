import React, { useState, useEffect } from "react";
import Sidebar from "../../navAndSidebar/sidebar/sidebar";
import NavBar from "../../navAndSidebar/navBar/NavBar";
import "../homeCSS/Dashboard-Style/dashboard.css";
import RideHistory from "../HISTORY_MODULES/RideHistory";
import AuctionHistory from "../HISTORY_MODULES/AuctionHistory";
import BuyingHistory from "../HISTORY_MODULES/BuyingHistory";
import dashboardData from "../../../utils/json/dashboardData.json";
import "../homeCSS/History-Module-Style/historyModel.css";
import { Typography, Button, Card, CardContent } from "@mui/material";
import axios from "axios";
import LoadingSpinner from "../../../utils/LoadingSpinner";
import {
  getUserInfo,
  updateUserRequiredInfo,
} from "../../../api/actions/userActivity";
import { resetState2 } from "../../../api/reducerSlices/userActivitySlice";
import { useDispatch, useSelector } from "react-redux";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, userInfoUpdStatus, userReqInfoData } = useSelector(
    (state) => state.userActivitySlice
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(
    localStorage.getItem("sidebarShrink") === "true" ? false : true
  );
  const [data, setData] = useState(dashboardData ? dashboardData : null);
  const [showRideHistory, setShowRideHistory] = useState(false);
  const [showAuctionHistory, setShowAuctionHistory] = useState(false);
  const [showBuyingHistory, setShowBuyingHistory] = useState(false);
  const [profileTabActiveNow, setProfileTabActiveNow] = useState(false);
  const [logoutFromUM, setLogoutFromUM] = useState(false);
  const [isDashboardInfoEdit, setIsDashboardInfoEdit] = useState(false);
  const [dashboardInfo, setDashboardInfo] = useState({
    phoneNumber: "",
    cnic: "",
    recoveryEmail: "",
  });
  const [verificationResult, setVerificationResult] = useState(null);

  const toggleRideHistory = () => {
    setShowRideHistory(!showRideHistory);
  };

  const toggleAuctionHistory = () => {
    setShowAuctionHistory(!showAuctionHistory);
  };

  const toggleBuyingHistory = () => {
    setShowBuyingHistory(!showBuyingHistory);
  };

  const [isResponsive, setIsResponsive] = useState(window.innerWidth < 899);

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

  const handleEditClick = () => {
    setIsDashboardInfoEdit(true);
  };

  useEffect(() => {
    dispatch(getUserInfo(user?.user_id));
  }, []);

  useEffect(() => {
    console.log(userReqInfoData);
    if (userReqInfoData !== null) {
      setDashboardInfo({
        phoneNumber: userReqInfoData?.recoveryPhoneNumber,
        cnic: userReqInfoData?.cnic,
        recoveryEmail: userReqInfoData?.recoveryEmail,
      });
    }
  }, [userReqInfoData]);

  useEffect(() => {
    if (userInfoUpdStatus === true) {
      alert("Info Updated!");
      dispatch(resetState2());
      setIsDashboardInfoEdit(false);
    }
  }, [userInfoUpdStatus]);

  const verifyEmail = async () => {
    const apiKey = process.env.NEXT_PUBLIC_HUNTER_API_KEY;
    if (!apiKey) {
      console.error("Missing NEXT_PUBLIC_HUNTER_API_KEY");
      return false;
    }
    const apiUrl = `https://api.hunter.io/v2/email-verifier?email=${dashboardInfo?.recoveryEmail}&api_key=${apiKey}`;
    setVerificationResult(null);
    try {
      const response = await axios.get(apiUrl);
      setVerificationResult(response?.data?.data);
      console.log(response?.data?.data);
      if (response?.data?.data?.status === "valid") {
        return true;
      } else {
        alert("The email address is not valid.");
        return false;
      }
    } catch (err) {
      console.log(err);
      alert("An error occurred while verifying the email.");
      return false;
    }
  };

  const handleInputChange = (fieldname, e) => {
    let value = e.target.value;

    // Validate CNIC and Recovery Phone Number to allow only numeric input
    if (fieldname === "cnic" || fieldname === "phoneNumber") {
      // Filter out non-numeric characters
      value = value.replace(/[^0-9]/g, "");
    }

    setDashboardInfo({
      ...dashboardInfo,
      [fieldname]:
        fieldname === "cnic" || fieldname === "phoneNumber"
          ? value
          : e.target.value,
    });
  };

  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z][A-Za-z0-9._%+-]+@gmail\.com$/;
    return emailRegex.test(email);
  };

  const updatedsbInfo = async () => {
    if (
      dashboardInfo?.phoneNumber !== "" ||
      dashboardInfo?.cnic !== "" ||
      dashboardInfo?.recoveryEmail !== ""
    ) {
      if (!validateEmail(dashboardInfo?.recoveryEmail)) {
        alert(
          "Please enter a valid email address and use your google account."
        );
        return;
      }
      // const isEmailValid = await verifyEmail();
      // if (!isEmailValid) {
      //   return;
      // }
      let dataToSend = {
        userId: user?.user_id,
        cnic: dashboardInfo?.cnic,
        recoveryPhoneNumber: dashboardInfo?.phoneNumber,
        recoveryEmail: dashboardInfo?.recoveryEmail,
      };
      console.log(dataToSend);
      dispatch(updateUserRequiredInfo(dataToSend));
      // setIsDashboardInfoEdit(false);
    } else {
      alert("Fill all required fields!");
    }
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
          <div className="dashboard">
            {/* <div className="user-level-tile">
              <Typography variant="h4" gutterBottom>
                User Level: {data.userLevel}
              </Typography>
            </div> */}
            {/* <div className="cardCover"> */}
            {/* <Card className="ride-status-tile tile">
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    Ride Status
                  </Typography>
                  <div className="ride-status-content">
                    <div className="itemRow">
                      <Typography variant="body1">
                        See your completed ride history
                      </Typography>
                    </div>
                    {showRideHistory && (
                      <RideHistory
                        history={data.rideStatus.rideHistory}
                        onClose={toggleRideHistory}
                      />
                    )}
                  </div>
                  <Button
                    variant="contained"
                    className="dbbtn"
                    onClick={toggleRideHistory}
                  >
                    View Ride History
                  </Button>
                </CardContent>
              </Card> */}
            {/* <Card className="auction-status-tile tile">
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    Auction Status
                  </Typography>
                  <div className="auction-status-content">
                    <div className="itemRow">
                      <Typography variant="body1">
                        Successful Auctions :
                      </Typography>
                      <Typography variant="body1">
                        {data.auctionStatus.successfulAuctions}
                      </Typography>
                    </div>
                    <div className="itemRow">
                      <Typography variant="body1">
                        Unsuccessful Auctions :
                      </Typography>
                      <Typography variant="body1">
                        {data.auctionStatus.unsuccessfulAuctions}
                      </Typography>
                    </div>
                    {showAuctionHistory && (
                      <AuctionHistory
                        history={data.auctionStatus.auctionHistory}
                        onClose={toggleAuctionHistory}
                      />
                    )}
                  </div>
                  <Button
                    variant="contained"
                    className="dbbtn"
                    onClick={toggleAuctionHistory}
                  >
                    View Auction History
                  </Button>
                </CardContent>
              </Card> */}
            {/* <Card className="auction-to-buy-bike-tile tile">
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    Auction for Buying Bike
                  </Typography>
                  <div className="auction-to-buy-bike-content">
                    <div className="itemRow">
                      <Typography variant="body1">Bikes Bought :</Typography>
                      <Typography variant="body1">
                        {data.auctionToBuyBike.bikesBought}
                      </Typography>
                    </div>
                    {showBuyingHistory && (
                      <BuyingHistory
                        history={data.auctionToBuyBike.buyingHistory}
                        onClose={toggleBuyingHistory}
                      />
                    )}
                  </div>
                  <Button
                    variant="contained"
                    className="dbbtn"
                    onClick={toggleBuyingHistory}
                  >
                    View Buying History
                  </Button>
                </CardContent>
              </Card> */}
            {/* </div> */}
            <div className="userdsbInfo">
              <div className="userdsbInfo-headerLine">
                <span> Required Info</span>
                {isDashboardInfoEdit ? (
                  <button onClick={updatedsbInfo}>update</button>
                ) : (
                  <button onClick={handleEditClick}>Edit</button>
                )}
              </div>
              {/* <div className="row">
                <span>Name: </span>
                {isDashboardInfoEdit ? (
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={dashboardInfo.name}
                    onChange={(e) => handleInputChange("name", e)}
                  />
                ) : (
                  <p>{dashboardInfo && dashboardInfo.name}</p>
                )}
              </div> */}
              <div className="row">
                <span style={{ display: "flex" }}>
                  CNIC<div style={{ color: "red", width: "auto" }}>*</div>:
                  (without dashes)
                </span>
                {isDashboardInfoEdit ? (
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={dashboardInfo.cnic}
                    onChange={(e) => handleInputChange("cnic", e)}
                  />
                ) : (
                  <p>{dashboardInfo.cnic}</p>
                )}
              </div>
              <div className="row">
                <span style={{ display: "flex" }}>
                  Recovery Phone Number
                  <div style={{ color: "red", width: "auto" }}>*</div>:
                </span>
                {isDashboardInfoEdit ? (
                  <input
                    type="text"
                    name="phoneNumber"
                    id="phoneNumber"
                    value={dashboardInfo.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e)}
                  />
                ) : (
                  <p>{dashboardInfo.phoneNumber}</p>
                )}
              </div>
              <div className="row">
                <span style={{ display: "flex" }}>
                  Recovery Email
                  <div style={{ color: "red", width: "auto" }}>*</div>:
                </span>
                {isDashboardInfoEdit ? (
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={dashboardInfo.recoveryEmail}
                    onChange={(e) => handleInputChange("recoveryEmail", e)}
                  />
                ) : (
                  <p>{dashboardInfo.recoveryEmail}</p>
                )}
              </div>
            </div>
            <div className="glfspfgv"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
