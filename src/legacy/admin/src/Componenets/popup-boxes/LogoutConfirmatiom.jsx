import React from "react";
require("./popupScreenStyle.css");

const LogoutConfirmatiom = ({ onConfirm, onCancel }) => {
  return (
    <div className="popupScreen">
      <div className="popup logoutConfirmationPopup">
        <div className="popupHeading">Logout</div>
        <div className="boxContent">
          <p>Are you sure you want to logout?</p>
          <div className="buttons">
            <button
              onClick={() => {
                onConfirm();
              }}
            >
              Logout
            </button>
            <button
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmatiom;
