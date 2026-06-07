import React from "react";
import XIcon from "../../../assets/svgs/XIcon";
require("../popupScreenStyle.css");

export function EventSuccessPopup({ showPopupMsg, onClose }) {
  return (
    <div className="popup slidingPopup slidingPopupOneline">
      <p>{showPopupMsg}</p>
      <div className="closePopup" onClick={onClose}>
        <XIcon />
      </div>
    </div>
  );
}

export function EventFailedPopup({ showPopupMsg, onClose }) {
  return (
    <div className="popup slidingPopup">
      <p>{showPopupMsg}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
