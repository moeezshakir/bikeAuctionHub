import React, { useRef } from "react";
import "../homeCSS//History-Module-Style/historyModel.css";
import CLoseIcon from "../../../assets/svgs/closeIcon";
import DownloadIcon from "../../../assets/svgs/DownloadIcon";
import { downloadPDF } from "../../../utils/CommonUtils";

const BuyingHistory = ({ history, onClose }) => {
  const pdfRef = useRef();

  return (
    <div className="historyModal">
      <div className="modal-content">
        <div className="headerLine">
          <span>Buying History</span>
          <div className="downloadbtn" onClick={() => downloadPDF(pdfRef)}>
            <DownloadIcon />
          </div>
          <div className="close" onClick={onClose}>
            <CLoseIcon />
          </div>
        </div>
        <div className="historyItemBoxCover" ref={pdfRef}>
          {history.map((buy) => (
            <div className="historyItemBox" key={buy.id}>
              <div className="itemRow">
                <strong>{buy.title}</strong>
              </div>
              <div className="itemRow">
                <span>Highest Bid:</span>
                <p>{buy.highestBid}</p>
              </div>
              <div className="itemRow">
                <span>Status:</span>
                <p>{buy.status}</p>
              </div>
              <div className="itemRow">
                <span>Motor Bike Type:</span>
                <p>{buy.motorBikeType}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyingHistory;
