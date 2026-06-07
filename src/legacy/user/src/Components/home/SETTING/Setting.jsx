import React, { useState, useEffect } from "react";
import Sidebar from "../../navAndSidebar/sidebar/sidebar";
import NavBar from "../../navAndSidebar/navBar/NavBar";
import SettingContent from "./SettingsContent";
import ReportAnIssue from "./ReportAnIssue";
import ChangePassword from "./ChangePassword";
import MoveBackIcon from "../../../assets/svgs/MoveBackIcon";
import LoadingSpinner from "../../../utils/LoadingSpinner";
import { useDispatch, useSelector } from "react-redux";
import { deleteAccount } from "../../../api/actions/homeActions";
import { resetState2 } from "../../../api/reducerSlices/homeSlice";
require("../homeCSS/Settings-Style/settings.css");

const Setting = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, accountDeleted } = useSelector(
    (state) => state.homeSlice
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(
    localStorage.getItem("sidebarShrink") === "true" ? false : true
  );
  const [settingPageShow, setSettingPageShow] = useState(true);
  const [settingContentShow, setSettingContentShow] = useState(true);
  const [settingContentPageContent, setSettingContentPageContent] =
    useState("");
  const [reportAnIssueOverlay, setReportAnIssueOverlay] = useState(false);
  const [changePasswordOverlay, setChangePasswordOverlay] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tileClickedForLogout, setTileClickedForLogout] = useState(false);
  const [profileTabActiveNow, setProfileTabActiveNow] = useState(false);
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

  const openSettingContent = (contentToDisplay) => {
    setSettingPageShow(false);
    setSettingContentPageContent(contentToDisplay);
    setSettingContentShow(true);
  };

  useEffect(() => {}, [settingContentPageContent]);

  const openReportAnIssueOverlay = () => {
    setSettingPageShow(false);
    setReportAnIssueOverlay(true);
  };

  const openChangePasswordOverlay = () => {
    setSettingPageShow(false);
    setChangePasswordOverlay(true);
  };

  const deleteUserAccount = () => {
    setSettingPageShow(false);
    setIsDeletingAccount(true);
  };

  const goBackToSettings = () => {
    if (settingContentShow) {
      setSettingContentShow(false);
      setSettingContentPageContent("");
    }
    if (reportAnIssueOverlay) {
      setReportAnIssueOverlay(false);
    }
    if (changePasswordOverlay) {
      setChangePasswordOverlay(false);
    }
    if (isDeletingAccount) {
      setIsDeletingAccount(false);
    }
    setSettingPageShow(true);
  };

  const handleDeleteAccount = () => {
    // Show a confirmation dialog to the user
    const confirmation = window.confirm(
      "Are you sure you want to delete your account?"
    );

    if (confirmation) {
      let object = {
        user_id: user?.user_id,
      };

      dispatch(deleteAccount(object));
      setIsDeleting(true);
      // setTimeout(() => {
      //   setIsDeleting(false);
      //   alert("Account deleted");
      // }, 2000); // Simulating a delay of 2 seconds
    }
  };

  const logout = () => {
    setTileClickedForLogout(true);
  };

  useEffect(() => {}, [tileClickedForLogout]);

  useEffect(() => {
    if (accountDeleted === true) {
      setIsDeleting(false);
      // alert("Account deleted");
      dispatch(resetState2());
      logout();
    }
  }, [accountDeleted]);

  return (
    <>
      {status === "loading" && <LoadingSpinner />}
      <div className="appContainer">
        <NavBar
          sidebarToggle={handleOpenSidebar}
          setSideBarCloseIfOpen={handleCloseSidebar}
          openProfileTab={setActiveTabProfile}
          logoutFuncInNav={logout}
        />
        <div className="containerChild">
          <div className={`sidebar ${isSidebarOpen ? "sidebarShrink" : ""}`}>
            <Sidebar
              closeSideBar={handleCloseSidebar1}
              tileClickedForLogout={tileClickedForLogout}
              profileTabActiveNow={profileTabActiveNow}
              setProfileTabActiveNow={setProfileTabActiveNow}
            />
          </div>
          <div className="content-container">
            <div className="setting-content-container">
              {settingPageShow && (
                <>
                  <div className="headerLine">
                    <span>Settings</span>
                  </div>
                  <div className="settingsTiles">
                    {/* <div className="settingsTiesTile">
                <span>Subscriptions</span>
              </div> */}
                    <div
                      className="settingsTiesTile"
                      onClick={() => openSettingContent("terms")}
                    >
                      <span>Terms & Conditons</span>
                    </div>
                    <div
                      className="settingsTiesTile"
                      onClick={() => openSettingContent("policy")}
                    >
                      <span>Privacy & Policy</span>
                    </div>
                    <div
                      className="settingsTiesTile"
                      onClick={openReportAnIssueOverlay}
                    >
                      <span>Report an Issue</span>
                    </div>
                    <div
                      className="settingsTiesTile"
                      onClick={openChangePasswordOverlay}
                    >
                      <span>Change Password</span>
                    </div>
                    <div
                      className="settingsTiesTile"
                      onClick={deleteUserAccount}
                    >
                      <span>Delete Account</span>
                    </div>
                    <dib className="line"></dib>
                    <div className="settingsTiesTile" onClick={logout}>
                      <span>Logout</span>
                    </div>
                  </div>
                </>
              )}
              {settingContentShow && settingContentPageContent !== "" && (
                <SettingContent
                  settingContentPageContent={settingContentPageContent}
                  goBack={goBackToSettings}
                />
              )}
              {reportAnIssueOverlay && (
                <ReportAnIssue goBack={goBackToSettings} />
              )}
              {changePasswordOverlay && (
                <ChangePassword goBack={goBackToSettings} />
              )}
              {isDeletingAccount && (
                <div className="overlayForDeletingAccount">
                  <div className="header">
                    <div className="moveBack" onClick={goBackToSettings}>
                      <MoveBackIcon />
                    </div>
                  </div>
                  <div className="contentBox">
                    <p className="warning-message">
                      Warning: Deleting your account will also delete all
                      associated data, and it cannot be recovered.
                    </p>
                    <button
                      className="delete-account-button"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Setting;
