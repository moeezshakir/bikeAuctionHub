import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../navAndSidebar/sidebar/sidebar";
import NavBar from "../../navAndSidebar/navBar/NavBar";
import AddAndEditAwardPage from "./addAndEditAwardPage";
import defaultBackgroundImage from "../../../assets/Images/Profile-BackGround.png";
import awardsData from "../../../utils/json/awardsData.json";
import profileData from "../../../utils/json/userProfileData.json";
import "../homeCSS/Profile-Style/profile.css";
import axios from "axios";
import Ellipse from "../../../assets/Images/Ellipse.png";
import {
  getUserProfileData,
  updateUserProfileData,
  updateProfilePic,
} from "../../../api/actions/profileActions";
import { resetError } from "../../../api/reducerSlices/profileSlice";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../../../utils/LoadingSpinner";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, userprofileData, userprofileUpdated, userprofilePic } =
    useSelector((state) => state.profileSlice);

  const [isSidebarOpen, setIsSidebarOpen] = useState(
    localStorage.getItem("sidebarShrink") === "true" ? false : true
  );

  const [isProfileInfoEdit, setIsProfileInfoEdit] = useState(false);
  const [isProfileImage, setIsProfileImage] = useState(true);
  const [isawardBoxOpen, setIsawardBoxOpen] = useState(false);
  const [selectedAwardTileData, setSelectedAwardTileData] = useState(null);
  const [isAwardsEditable, setIsAwardsEditable] = useState(false);
  const fileInputRef = useRef(null);
  const [logoutFromUM, setLogoutFromUM] = useState(false);
  const [ppup, setPpup] = useState(null);
  const [image, setImage] = useState(null);
  const [imageChange, setImageChange] = useState(false);
  const [imageForNav, setImageForNav] = useState(null);

  const [profileInfo, setProfileInfo] = useState({
    name: "",
    image: "",
    email: "",
    phoneNumber: "",
    address: "",
    nationality: "",
    languages: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      linkedIn: "",
      youtube: "",
    },
  });

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

  const logOutUser = () => {
    setLogoutFromUM(true);
  };

  // get profile data
  useEffect(() => {
    console.log(user);
    dispatch(resetError());
    dispatch(getUserProfileData(user?.user_id));
  }, []); // Empty dependency array ensures the effect runs only once

  // get profile data
  useEffect(() => {
    if (userprofilePic === true || userprofileUpdated === true) {
      dispatch(getUserProfileData(user?.user_id));
    }
    if (userprofilePic === false && error !== "") {
      setImage(null);
      alert(error);
    }
  }, [userprofileUpdated, userprofilePic, error]);

  useEffect(() => {
    if (userprofileData) {
      setImageForNav(userprofileData?.image);
      setProfileInfo({
        name: userprofileData?.name,
        image: userprofileData?.image,
        email: userprofileData?.email,
        phoneNumber: userprofileData?.phoneNumber,
        address: userprofileData?.address,
        nationality: userprofileData?.nationality,
        languages: userprofileData?.languages,
        socialLinks: {
          facebook: userprofileData?.socialLinks?.facebook,
          instagram: userprofileData?.socialLinks?.instagram,
          linkedIn: userprofileData?.socialLinks?.linkedin,
          youtube: userprofileData?.socialLinks?.youtube,
        },
      });
    }
  }, [userprofileData]);

  const sbiss = () => {
    if (imageChange === true) {
      setImageChange(false);
    }
  };

  const [validationErrorsForURL, setValidationErrorsForURL] = useState({
    facebook: false,
    instagram: false,
    linkedIn: false,
    youtube: false,
  });

  // Function to check if the provided URL is a valid Facebook link
  function isValidFacebookLink(url) {
    const facebookUrlRegex = /^(https?:\/\/)?(www\.)?(web\.)?facebook.com\/.*/;
    return facebookUrlRegex.test(url);
  }

  // Function to check if the provided URL is a valid Instagram link
  function isValidInstagramLink(url) {
    const instagramUrlRegex = /^(https?:\/\/)?(www\.)?instagram.com\/.*/;
    return instagramUrlRegex.test(url);
  }

  // Function to check if the provided URL is a valid LinkedIn link
  function isValidLinkedInLink(url) {
    const linkedInUrlRegex = /^(https?:\/\/)?(www\.)?linkedin.com\/.*/;
    return linkedInUrlRegex.test(url);
  }

  // Function to check if the provided URL is a valid YouTube link
  function isValidYouTubeLink(url) {
    const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?youtube.com\/.*/;
    return youtubeUrlRegex.test(url);
  }
  const checkurlvalidity = (fieldName, value) => {
    switch (fieldName) {
      case "facebook":
        setValidationErrorsForURL({
          ...validationErrorsForURL,
          facebook: isValidFacebookLink(value) ? false : true,
        });
        break;
      case "instagram":
        setValidationErrorsForURL({
          ...validationErrorsForURL,
          instagram: isValidInstagramLink(value) ? false : true,
        });
        break;
      case "linkedIn":
        setValidationErrorsForURL({
          ...validationErrorsForURL,
          linkedIn: isValidLinkedInLink(value) ? false : true,
        });
        break;
      case "youtube":
        setValidationErrorsForURL({
          ...validationErrorsForURL,
          youtube: isValidYouTubeLink(value) ? false : true,
        });
        break;
      default:
        break;
    }
  };

  const handleSocialLinksInfoChange = (fieldName, value) => {
    setProfileInfo({
      ...profileInfo,
      socialLinks: {
        ...profileInfo.socialLinks,
        [fieldName]: value,
      },
    });
    switch (fieldName) {
      case "facebook":
      case "instagram":
      case "linkedIn":
      case "youtube":
        checkurlvalidity(fieldName, value);
        break;
      default:
        break;
    }
  };

  const handleEditClick = () => {
    setIsProfileInfoEdit(true);
  };

  const handlePlusClick = () => {
    if (isProfileInfoEdit) {
      fileInputRef.current.click();
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileInfo({
          ...profileInfo,
          image: reader.result,
        });
        setPpup(reader.result);
      };
      reader.readAsDataURL(file);
      setImage(file);
      setImageChange(true);
      // const dataToSend = {
      //   files: file,
      // };
      // dispatch(updateUserProfileImage(dataToSend));
    }
  };

  const handleInputChange = (fieldname, e) => {
    setProfileInfo({
      ...profileInfo,
      [fieldname]: e.target.value,
    });
  };

  const handleAddAwards = () => {
    setIsawardBoxOpen(true);
    setIsProfileImage(false);
  };

  const closeAddAwardsPage = () => {
    setIsawardBoxOpen(false);
    setIsProfileImage(true);
    setSelectedAwardTileData(null);
    setIsAwardsEditable(false);
  };

  const handleEditAchievement = (awardData) => {
    setSelectedAwardTileData(awardData);
    setIsAwardsEditable(true);
    setIsawardBoxOpen(true);
    setIsProfileImage(false);
  };

  // update profile data function
  const updatePersonalInfo = async () => {
    const errors = {};
    if (!profileInfo.name) errors.name = "Name is required";
    if (!profileInfo.phoneNumber)
      errors.phoneNumber = "Phone number is required";
    if (!profileInfo.address) errors.address = "Address is required";
    if (!profileInfo.nationality)
      errors.nationality = "Nationality is required";
    if (!profileInfo.languages) errors.languages = "Languages is required";
    if (Object.keys(errors).length === 0) {
      let updatedProfileData = {
        user_id: user?.user_id,
        name: profileInfo?.name,
        image: ppup,
        // image: profileInfo?.image,
        email: profileInfo?.email,
        phoneNumber: profileInfo?.phoneNumber,
        address: profileInfo?.address,
        nationality: profileInfo?.nationality,
        languages: profileInfo?.languages,
        socialLinks: {
          facebook: profileInfo?.socialLinks?.facebook,
          instagram: profileInfo?.socialLinks?.instagram,
          linkedin: profileInfo?.socialLinks?.linkedIn,
          youtube: profileInfo?.socialLinks?.youtube,
        },
      };
      console.log(updatedProfileData);
      dispatch(updateUserProfileData(updatedProfileData));
      if (image) {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("user_id", user?.user_id);
        let user_id = user?.user_id;
        dispatch(updateProfilePic({ user_id, formData }));
        setImageChange(false);
      }
      setIsProfileInfoEdit(false);
      dispatch(getUserProfileData(user?.user_id));
    } else {
      alert("Please fill in all required fields!");
    }
  };

  return (
    <>
      {status === "loading" && <LoadingSpinner />}
      <div className="appContainer">
        <NavBar
          sidebarToggle={handleOpenSidebar}
          setSideBarCloseIfOpen={handleCloseSidebar}
          logoutFuncInNav={logOutUser}
          imageChange={imageChange}
          imageForNav={imageForNav}
          csbiss={sbiss}
        />
        <div className="containerChild">
          <div className={`sidebar ${isSidebarOpen ? "sidebarShrink" : ""}`}>
            <Sidebar
              closeSideBar={handleCloseSidebar1}
              logoutFromUM={logoutFromUM}
              setLogoutFromUM={setLogoutFromUM}
            />
          </div>
          <div className="content-container">
            {isProfileImage && (
              <div className="profileContainer">
                <div className="headerline">
                  <span>Profile</span>
                </div>
                <div className="profileBox">
                  <div className="pabgl">
                    <div className="profilePic" onClick={handlePlusClick}>
                      {isProfileInfoEdit ? (
                        <>
                          {profileInfo?.image ? (
                            <>
                              <img
                                // src={
                                // typeof profileInfo?.image === "string"
                                //   ? profileInfo?.image
                                //   : profileInfo?.image ||
                                // URL.createObjectURL(profileInfo?.image)
                                // }
                                src={
                                  imageChange === true
                                    ? URL.createObjectURL(image)
                                    : image !== null
                                    ? URL.createObjectURL(image)
                                    : `/api/php/${profileInfo?.image}`
                                }
                                alt="Profile"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                ref={fileInputRef}
                                onChange={handleProfilePicChange}
                              />
                              <span>+</span>
                            </>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                ref={fileInputRef}
                                onChange={handleProfilePicChange}
                              />
                              <span>+</span>
                              {/* {profileInfo?.image ? (
                            <img
                              src={
                                typeof profileInfo?.image === "string"
                                  ? profileInfo?.image
                                  : URL.createObjectURL(profileInfo?.image)
                              }
                              alt="Profile"
                            />
                          ) : ( */}
                              {/* <img src={defaultBackgroundImage} alt="Profile" /> */}
                              {/* )} */}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {profileInfo?.image ? (
                            <img
                              // src={
                              //   typeof profileInfo?.image === "string"
                              //     ? profileInfo?.image
                              //     : profileInfo?.image ||
                              //       URL.createObjectURL(profileInfo?.image)
                              // }
                              src={
                                imageChange === true
                                  ? URL.createObjectURL(image)
                                  : image !== null
                                  ? URL.createObjectURL(image)
                                  : `/api/php/${profileInfo?.image}`
                              }
                              alt="Profile"
                            />
                          ) : (
                            // <img src={""} alt="Profile" />
                            ""
                          )}
                        </>
                      )}
                    </div>
                    {isProfileInfoEdit ? (
                      <button onClick={updatePersonalInfo}>update</button>
                    ) : (
                      <button onClick={handleEditClick}>Edit Profile</button>
                    )}
                  </div>
                </div>
                <div className="userProfileInfo">
                  <div className="upiHederLine">
                    <span>My Info</span>
                  </div>
                  <div className="firstbox">
                    <div className="row">
                      <span>Name: </span>
                      {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={profileInfo.name}
                          onChange={(e) => handleInputChange("name", e)}
                        />
                      ) : (
                        // <p>{profileInfo.name}</p>
                        <p>{profileInfo && profileInfo.name}</p>
                      )}
                    </div>
                    <div className="row">
                      <span>Email:</span>
                      {/* {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="email"
                          id="email"
                          value={profileInfo.email}
                          onChange={(e) => handleInputChange("email", e)}
                          disabled
                        />
                      ) : ( */}
                      <p>{profileInfo.email}</p>
                      {/* )} */}
                    </div>
                    <div className="row">
                      <span>Phone Number:</span>
                      {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="phoneNumber"
                          id="phoneNumber"
                          value={profileInfo.phoneNumber}
                          onChange={(e) => handleInputChange("phoneNumber", e)}
                        />
                      ) : (
                        <p>{profileInfo.phoneNumber}</p>
                      )}
                    </div>
                    <div className="row">
                      <span>Address:</span>
                      {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="address"
                          id="address"
                          value={profileInfo.address}
                          onChange={(e) => handleInputChange("address", e)}
                        />
                      ) : (
                        <p>{profileInfo.address}</p>
                      )}
                    </div>
                    <div className="row">
                      <span>Nationality:</span>
                      {isProfileInfoEdit ? (
                        <select
                          name="nationality"
                          id="nationality"
                          value={profileInfo.nationality}
                          onChange={(e) => handleInputChange("nationality", e)}
                        >
                          <option value="">Select Nationality</option>
                          <option value="Pakistan">Pakistan</option>
                          <option value="Iran">Iran</option>
                          <option value="Indian">Indian</option>
                          <option value="American">American</option>
                          <option value="British">British</option>
                          <option value="Canadian">Canadian</option>
                          <option value="Indian">Indian</option>
                          <option value="Australian">Australian</option>
                          {/* Add more options as needed */}
                        </select>
                      ) : (
                        <p>{profileInfo.nationality}</p>
                      )}
                    </div>
                    <div className="row">
                      <span>Languages:</span>
                      {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="languages"
                          id="languages"
                          value={profileInfo.languages}
                          onChange={(e) => handleInputChange("languages", e)}
                        />
                      ) : (
                        <p>{profileInfo.languages}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="socialLinksBox">
                  <div className="headerLine">
                    <span>Social Links</span>
                  </div>
                  <div
                    className="userSocialLinks"
                    style={{ marginBottom: "20px" }}
                  >
                    <div className="row">
                      <span>Facebook:</span>
                      {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="facebookLink"
                          id="facebookLink"
                          value={profileInfo.socialLinks.facebook}
                          onChange={(e) =>
                            handleSocialLinksInfoChange(
                              "facebook",
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p>{profileInfo.socialLinks.facebook}</p>
                      )}
                    </div>
                    <div className="row">
                      <span>Instagram:</span>
                      {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="instagramLink"
                          id="instagramLink"
                          value={profileInfo.socialLinks.instagram}
                          onChange={(e) =>
                            handleSocialLinksInfoChange(
                              "instagram",
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p>{profileInfo.socialLinks.instagram}</p>
                      )}
                    </div>
                    <div className="row">
                      <span>linkedIn:</span>
                      {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="linkedInLink"
                          id="linkedInLink"
                          value={profileInfo.socialLinks.linkedIn}
                          onChange={(e) =>
                            handleSocialLinksInfoChange(
                              "linkedIn",
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p>{profileInfo.socialLinks.linkedIn}</p>
                      )}
                    </div>
                    <div className="row">
                      <span>Youtube:</span>
                      {isProfileInfoEdit ? (
                        <input
                          type="text"
                          name="youtubeLink"
                          id="youtubeLink"
                          value={profileInfo.socialLinks.youtube}
                          onChange={(e) =>
                            handleSocialLinksInfoChange(
                              "youtube",
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p>{profileInfo.socialLinks.youtube}</p>
                      )}
                    </div>
                  </div>
                </div>
                {/* <div className="awards">
                  <div className="headerLine">
                    <div className="heading">
                      <span>Achievements</span>
                    </div>
                    <div className="editBtn" onClick={() => handleAddAwards()}>
                      Add
                    </div>
                  </div>
                  <div className="awardBoxLine">
                    {awardsData?.awards?.map((doc, index) => (
                      <div
                        className="awardTile"
                        key={doc._id}
                        onClick={() => handleEditAchievement(doc)}
                      >
                        <div className="awardTileImage">
                          <img src={doc.image} alt={`award-${index + 1}`} />
                        </div>
                        <div className="awardTileTitle">
                          <p>{doc.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div> */}
              </div>
            )}
            {isawardBoxOpen && (
              <AddAndEditAwardPage
                goBackToProfilePage={closeAddAwardsPage}
                selectedAwardTileData={selectedAwardTileData}
                isAwardsEditable={isAwardsEditable}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
