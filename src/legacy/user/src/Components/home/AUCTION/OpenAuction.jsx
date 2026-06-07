import React, { useState, useEffect } from "react";
import Sidebar from "../../navAndSidebar/sidebar/sidebar";
import NavBar from "../../navAndSidebar/navBar/NavBar";
import "../homeCSS/Auction-Page-Style/openAuction.css";
import "../homeCSS/Auction-Page-Style/createAuctionSlotForm.css";
import CLoseIcon from "../../../assets/svgs/closeIcon";
import { Tabs, Tab, Box } from "@mui/material";
import SwipeableViews from "react-swipeable-views";
import RunningSLots from "./RunningSLots";
import { createAuctionSlot } from "../../../api/actions/auctionActions";
import { resetState } from "../../../api/reducerSlices/auctionSlice";
import { useDispatch, useSelector } from "react-redux";

const OpenAuction = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, auctionCreated } = useSelector(
    (state) => state.auctionSlice
  );

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

  //////////////////////////////////////////
  const [currentTab, setCurrentTab] = useState(0);
  const [slots, setSlots] = useState([]);

  const handleCreateSlot = (slotDetails) => {
    setSlots([...slots, slotDetails]);
    setCurrentTab(1); // Index of the "Running Slots" tab
  };

  useEffect(() => {
    if (auctionCreated === "created") {
      alert(
        "Your auction is now on pending so wait until we check it and allow it."
      );
    }
  }, [auctionCreated]);

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
          <div className="auctionContent">
            <Tabs
              className="auctionNavBar"
              value={currentTab}
              onChange={(event, newValue) => setCurrentTab(newValue)}
            >
              <Tab
                label="Create Slot"
                className={currentTab === 0 ? "active" : "nonactive"}
              />
              <Tab
                label="Running Slots"
                className={currentTab === 1 ? "active" : "nonactive"}
              />
              {/* <Tab
                label="Completed Slots"
                className={currentTab === 2 ? "active" : "nonactive"}
              /> */}
            </Tabs>
            <SwipeableViews
              index={currentTab}
              onChangeIndex={(index) => setCurrentTab(index)}
            >
              <TabPanel value={currentTab} index={0}>
                {/* Content for "Create Slot" tab */}
                <CreateSlotForm onCreateSlot={handleCreateSlot} />
              </TabPanel>
              <TabPanel value={currentTab} index={1}>
                {/* Content for "Running Slots" tab */}
                <RunningSLots />
              </TabPanel>
              <TabPanel value={currentTab} index={2}>
                {/* Content for "Completed Slots" tab */}
                <CompletedSlots slots={[]} />
              </TabPanel>
            </SwipeableViews>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenAuction;

// Custom TabPanel component to conditionally render content based on tab index
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function CreateSlotForm({ onCreateSlot }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, auctionCreated } = useSelector(
    (state) => state.auctionSlice
  );

  const [slotDetails, setSlotDetails] = useState({
    highestPrice: "",
    lowestPrice: "",
    duration: "",
  });
  const [images, setImages] = useState([]);
  const [imagesfs, setImagesfs] = useState([]);
  const [imagesValidate, setmagesValidate] = useState(false);

  const handleImageChange = (event) => {
    const files = event.target.files;
    if (images.length > 0) {
      // If there are existing images, add new ones without replacing existing ones
      const newImages = [...images];
      const newImagesFile = [...imagesfs];
      const remainingSlots = 4 - newImages.length;
      const remainingFiles = 4 - newImagesFile.length;
      if (files.length <= remainingSlots) {
        const additionalImages = Array.from(files).map((file) =>
          URL.createObjectURL(file)
        );
        newImages.push(...additionalImages);
        newImagesFile.push(Array.from(...files));
        setImages(newImages);
        setImagesfs(newImagesFile);
      } else {
        alert("You can only add up to " + remainingSlots + " more images.");
      }
    } else {
      // if (files.length < 4) {
      //   // Clear the input value to allow user to select again
      //   event.target.value = null;
      //   alert("Please select at least 4 images.");
      // } else
      if (files.length > 4) {
        // Clear the input value and alert if more than 4 images are selected
        event.target.value = null;
        alert("You can only select up to 4 images.");
      } else {
        const imageArray = Array.from(files).map((file) =>
          URL.createObjectURL(file)
        );
        setImages(imageArray);
        setImagesfs(Array.from(files));
      }
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    const newImages2 = [...imagesfs];
    newImages2.splice(index, 1);
    setImagesfs(newImages2);
  };

  const handleSlotDetailsChange = (e) => {
    const { name, value } = e.target;

    // Validate if the entered value is a positive number
    if (/^\d*\.?\d*$/.test(value)) {
      if (name === "duration" && value > 24) {
        alert("Duration Time is under 24 hours.");
        return;
      }
      setSlotDetails((prevDetails) => ({
        ...prevDetails,
        [name]: value,
      }));
    }
  };

  const handleSubmitForImages = async () => {
    if (images.length < 2) {
      // if (images.length < 4) {
      alert("Please select at least 2 images.");
      // alert("Please select at least 4 images.");
    } else {
      const isSameBike = await checkIfSameBike(images);
      if (isSameBike) {
        // onCreateSlot(slotDetails);
        setmagesValidate(true);
      } else {
        alert("All selected images must depict the same bike.");
      }
    }
  };

  const checkIfSameBike = async (images) => {
    const results = await Promise.all(images.map(checkForBike));
    return results.every((result) => result === results[0]);
  };

  const checkForBike = (image) => {
    return new Promise((resolve) => {
      // Simulating image recognition
      setTimeout(() => {
        // const isBike = Math.random() < 0.5;
        // resolve(isBike);
        resolve(true);
      }, 500); // Simulate API call delay
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if all fields are filled
    if (validateFields()) {
      // Perform validation before saving
      if (validateInputs()) {
        // Save the data
        let userId = user?.user_id;
        console.log("Slot details saved:", userId, slotDetails, imagesfs);
        // onCreateSlot(slotDetails);
        dispatch(
          createAuctionSlot({
            userId,
            slotDetails,
            images: imagesfs,
          })
        );
      } else {
        // Display an error message or handle the validation failure
        console.error("Validation failed: Please enter positive numbers.");
        alert("Please enter positive numbers.");
      }
    } else {
      // Display an error message or handle the validation failure
      console.error("Validation failed: Please fill all fields.");
      alert("Please fill all fields.");
    }
  };

  const validateInputs = () => {
    const { highestPrice, lowestPrice, duration } = slotDetails;

    // Check if all inputs are positive numbers
    if (
      parseFloat(highestPrice) >= 0 &&
      parseFloat(lowestPrice) >= 0 &&
      parseFloat(duration) >= 0
    ) {
      return true;
    }
    return false;
  };

  const validateFields = () => {
    const { highestPrice, lowestPrice, duration } = slotDetails;

    // Check if all fields are filled
    if (
      highestPrice.trim() === "" ||
      lowestPrice.trim() === "" ||
      duration.trim() === ""
    ) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (auctionCreated === "created") {
      setImages([]);
      setSlotDetails({
        highestPrice: "",
        lowestPrice: "",
        duration: "",
      });
      dispatch(resetState());
    }
  }, [auctionCreated]);

  return (
    <div className="createSlotForm">
      <h2>Create Slot</h2>
      <div className="imagePreviewBox">
        {images?.length < 4 && (
          <span
            onClick={() => document.getElementById("fileInput").click()}
            style={{ cursor: "pointer" }}
            className="span"
          >
            Select Image on click here
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              multiple
              style={{ display: "none", width: "100%" }}
            />
          </span>
        )}
        {images?.length > 0 && (
          <div className="imageContainer">
            {images?.map((image, index) => (
              <div key={index} className="imageCard">
                <img src={image} alt={`Preview ${index + 1}`} />
                <div
                  className="removeImage"
                  onClick={() => handleRemoveImage(index)}
                >
                  <CLoseIcon />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {!imagesValidate ? (
        <>
          <button onClick={handleSubmitForImages}>Fetch Images</button>
        </>
      ) : (
        <>
          <label>
            Highest Price:
            <input
              type="text"
              name="highestPrice"
              value={slotDetails.highestPrice}
              onChange={handleSlotDetailsChange}
            />
          </label>
          <label>
            Lowest Price:
            <input
              type="text"
              name="lowestPrice"
              value={slotDetails.lowestPrice}
              onChange={handleSlotDetailsChange}
            />
          </label>
          <label>
            Duration (in hours):
            <input
              type="text"
              name="duration"
              value={slotDetails.duration}
              onChange={handleSlotDetailsChange}
            />
          </label>
          <button onClick={handleSubmit}>Create Slot</button>
        </>
      )}
    </div>
  );
}

function CompletedSlots({ slots }) {
  return <h2>Completed Slots</h2>;
}
