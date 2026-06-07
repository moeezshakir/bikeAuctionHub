import React, { useRef, useState, useEffect } from "react";
import "../homeCSS//History-Module-Style/historyModel.css";
import CLoseIcon from "../../../assets/svgs/closeIcon";
import DownloadIcon from "../../../assets/svgs/DownloadIcon";
import { downloadPDF } from "../../../utils/CommonUtils";
import { getUserRideHistory } from "../../../api/actions/userActivity";
import { useDispatch, useSelector } from "react-redux";

const RideHistory = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, getRideHistoryData } = useSelector(
    (state) => state.userActivitySlice
  );
  const pdfRef = useRef();
  const [history, setHistory] = useState(null);

  useEffect(() => {
    dispatch(getUserRideHistory(user?.user_id));
  }, []);

  useEffect(() => {
    if (getRideHistoryData !== null) {
      console.log(getRideHistoryData);
      setHistory(getRideHistoryData);
    }
  }, [getRideHistoryData]);

  return (
    <div className="historyModal">
      <div className="modal-content">
        <div className="headerLine">
          <span>Ride History</span>
          <div className="downloadbtn" onClick={() => downloadPDF(pdfRef)}>
            <DownloadIcon />
          </div>
          <div className="close" onClick={onClose}>
            <CLoseIcon />
          </div>
        </div>
        <div className="historyItemBoxCover" ref={pdfRef}>
          {history?.map((ride) => (
            <div className="historyItemBox" key={ride?.id}>
              <div className="itemRow">
                <strong>{ride?.bike_type}</strong> - {ride?.status}
              </div>
              <div className="itemRow">
                <span>Start Time: </span>
                <p>{new Date(ride.start_time).toLocaleString()}</p>
              </div>
              <div className="itemRow">
                <span>End Time: </span>
                <p>{new Date(ride?.end_time).toLocaleString()}</p>
              </div>
              <div className="itemRow">
                <span>Location: </span>
                <p>{ride?.location}</p>
              </div>
            </div>
          ))}
          {history === null && (
            <p style={{ width: "100%", textAlign: "center" }}>
              Nothing to load
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideHistory;
