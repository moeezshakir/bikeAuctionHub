import React from "react";
require("../popupScreenStyle.css");

// Login page Popup component
export function LoginEventPopup({ showPopupMsg, onClose }) {
  return (
    <div className="popupScreen">
      <div className="popup">
        <p>{showPopupMsg}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
