import React, { useRef } from "react";
import "../homeCSS/History-Module-Style/historyModel.css";
import CLoseIcon from "../../../assets/svgs/closeIcon";
import DownloadIcon from "../../../assets/svgs/DownloadIcon";
import { downloadPDF } from "../../../utils/CommonUtils";

const AuctionHistory = ({ history, onClose }) => {
  const pdfRef = useRef();

  return (
    <div className="historyModal">
      <div className="modal-content">
        <div className="headerLine">
          <span>Auction History</span>
          <div className="downloadbtn" onClick={() => downloadPDF(pdfRef)}>
            <DownloadIcon />
          </div>
          <div className="close" onClick={onClose}>
            <CLoseIcon />
          </div>
        </div>
        <div className="historyItemBoxCover" ref={pdfRef}>
          {history.map((auction) => (
            <div className="historyItemBox" key={auction.id}>
              <div className="itemRow">
                <strong>{auction.title}</strong> - {auction.status}
              </div>
              <div className="itemRow">
                <span>Start Time:</span>
                <p>{auction.startTime}</p>
              </div>
              <div className="itemRow">
                <span>End Time:</span>
                <p>{auction.endTime}</p>
              </div>
              <div className="itemRow">
                <span>Participants:</span>
                <p>{auction.participants}</p>
              </div>
              <div className="itemRow">
                <span>Motor Bike Type:</span>
                <p>{auction.motorBikeType}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuctionHistory;
