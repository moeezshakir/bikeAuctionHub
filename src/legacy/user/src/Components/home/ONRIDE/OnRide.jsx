import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
import Sidebar from "../../navAndSidebar/sidebar/sidebar";
import NavBar from "../../navAndSidebar/navBar/NavBar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  getMapIcon,
  MAP_TILE_LAYER_URL,
  MAP_ATTRIBUTION,
  getCityNameFromCurrentLocation,
} from "../../../utils/CommonUtils";
import Ellipse from "../../../assets/Images/Ellipse.png";
import "../homeCSS/OnRide-Style/onride.css";
import MapWithUserLocation from "./mapComponent";
import StorePage from "./StorePage";
import MoveBackIcon from "../../../assets/svgs/MoveBackIcon";
import { Typography, Button, Card, CardContent } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  getStoreData,
  checkBookedBike,
} from "../../../api/actions/homeActions";
import { getUserInfo } from "../../../api/actions/userActivity";

const OnRide = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { userReqInfoData } = useSelector((state) => state.userActivitySlice);
  const { status, error, storesData, ridingStatus, bookingStatus } =
    useSelector((state) => state.homeSlice);

  const [isSidebarOpen, setIsSidebarOpen] = useState(
    localStorage.getItem("sidebarShrink") === "true" ? false : true
  );
  const [profileTabActiveNow, setProfileTabActiveNow] = useState(false);
  const [logoutFromUM, setLogoutFromUM] = useState(false);
  const [clickForRide, setClickForRide] = useState(false);
  const [rideStatus, setRideStatus] = useState("");
  // let rideStatus = "available";
  // let ridebook = true;
  // const [rideStatus, setRideStatus] = useState("available");
  const [storeIdForgl, setStoreIdForgl] = useState("");
  const [isStorePageOpen, setIsStorePageOpen] = useState(false);
  const [selectedStoreData, setSelectedStoreData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const mapOptions = {
    center: [(31.5497, 74.3436)],
    zoom: 15,
    maxZoom: 20,
    minZoom: 5,
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

  useEffect(() => {
    dispatch(checkBookedBike(user?.user_id));
  }, []);

  useEffect(() => {
    dispatch(getStoreData());
  }, []);

  useEffect(() => {
    if (ridingStatus === "succeeded") {
      setRideStatus("riding");
    }
    if (ridingStatus === "failed") {
      setRideStatus("available");
    }
  }, [ridingStatus]);

  useEffect(() => {
    if (storesData) {
      console.log(storesData);
    }
  }, [storesData]);

  const getMapUsersFromApi = async (position) => {
    const locationObj = {
      search: storesData?.location?.city,
    };
    if (position !== null && position !== undefined) {
      const cityName = await getCityNameFromCurrentLocation(position);
      locationObj.search = cityName;
    }
  };

  const setActiveTabProfile = () => {
    setProfileTabActiveNow(true);
  };

  useEffect(() => {
    if (bookingStatus === "succeeded") {
      setSelectedStoreData(null);
      setIsStorePageOpen(false);
    }
  }, [bookingStatus]);

  //////////////////////////////////
  const bookRide = async () => {
    let response = await dispatch(getUserInfo(user?.user_id));
    if (response?.payload.data) {
      setClickForRide(true);
    } else {
      setErrorMsg(
        "Please go on Dasboard and provide the required info then you can ride."
      );
    }
  };

  const openStorePage = (storeId, bikeLeft, selectedStoreData) => {
    if (bikeLeft === 0) {
      alert("No bike available in store for ride.");
      return;
    }
    setStoreIdForgl(storeId);
    setSelectedStoreData(selectedStoreData);
    setIsStorePageOpen(true);
  };

  const backFromStorepage = () => {
    setIsStorePageOpen(false);
    dispatch(getStoreData());
  };

  const togglemap = () => {
    setClickForRide(false);
  };

  const logOutUser = () => {
    setLogoutFromUM(true);
  };

  const ridebookfnc = () => {
    setIsStorePageOpen(false);
    setClickForRide(false);
    dispatch(checkBookedBike(user?.user_id));
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
          {!isStorePageOpen && (
            <div className="ridecontainer">
              {/* {!clickForRide && (
                <div className="getRide">
                  <div className="headerline">
                    <span>Go On Ride</span>
                  </div>
                  {rideStatus === "available" ? (
                    <>
                      <span>Rides are waiting for you.</span>
                      <button onClick={bookRide}>Go on Ride</button>
                    </>
                  ) : (
                    <button disabled>Go on Ride</button>
                  )}
                </div>
              )} */}
              {!clickForRide && (
                <Card className="getRide">
                  <CardContent>
                    <Typography variant="h5" component="div">
                      Go On Ride
                    </Typography>
                    <div className="rideInfo">
                      {rideStatus === "available" ? (
                        <>
                          <Typography variant="body1">
                            Rides are waiting for you!
                          </Typography>
                          <Button variant="contained" onClick={bookRide}>
                            Go on Ride
                          </Button>
                          {errorMsg && (
                            <Typography
                              variant="body1"
                              style={{ color: "red" }}
                            >
                              {errorMsg}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <>
                          <Typography variant="body1">
                            Can't select until your ride fininsh
                          </Typography>
                          {/* <Button variant="contained" disabled>
                            Go on Ride
                          </Button> */}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {clickForRide && (
                <>
                  <div className="mapCompHeader">
                    <div className="moveBack" onClick={togglemap}>
                      <MoveBackIcon />
                    </div>
                  </div>
                  <MapContainer
                    {...mapOptions}
                    style={{ height: "100vh", width: "100%" }}
                    center={[31.5497, 74.3436]}
                    // Use selected place's coordinates if available
                  >
                    <TileLayer
                      url={MAP_TILE_LAYER_URL}
                      attribution={MAP_ATTRIBUTION}
                      maxZoom={20}
                    />
                    {storesData &&
                      storesData.map(
                        (data) =>
                          data.location &&
                          data.location.latitude &&
                          data.location.longitude && (
                            <Marker
                              key={data._id}
                              position={[
                                data.location.latitude,
                                data.location.longitude,
                              ]}
                              icon={getMapIcon(
                                data?.image !== null && data?.image !== ""
                                  ? data?.image
                                  : Ellipse,
                                data?.bikeleft || 0
                              )}
                              eventHandlers={{
                                click: () =>
                                  openStorePage(
                                    data?._id,
                                    data?.bikeleft,
                                    data
                                  ),
                              }}
                              style={{
                                cursor: "pointer",
                                position: "relative",
                              }}
                            >
                              {/* <Popup>{data.location.address}</Popup> */}
                            </Marker>
                          )
                      )}

                    <MapWithUserLocation
                      // OtherUserdata={OtherUserdata}
                      onLocationFound={getMapUsersFromApi}
                    />
                  </MapContainer>
                </>
              )}
            </div>
          )}
          {isStorePageOpen && (
            <StorePage
              storeIdForgl={storeIdForgl}
              selectedStoreData={selectedStoreData}
              goBack={backFromStorepage}
              ridebookfnc={ridebookfnc}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnRide;
