import React, { useState, useEffect } from "react";
import { loadReportedIssues } from "../../../api/actions/authActions";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../../../utils/LoadingSpinner";
import "./HomeCSS/contactedListData.css";

const ReportedIssuesList = () => {
  const { status, reportedIssuesData } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [groupedData, setGroupedData] = useState(null);

  useEffect(() => {
    dispatch(loadReportedIssues());
  }, [dispatch]);

  useEffect(() => {
    if (reportedIssuesData) {
      console.log(reportedIssuesData);
      setGroupedData(reportedIssuesData);
    }
  }, [reportedIssuesData]);

  function formatDateTime(datetime) {
    const dateObj = new Date(datetime);
    const now = new Date();

    // Check if it's today
    if (dateObj.toDateString() === now.toDateString()) {
      return "Today";
    }

    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // Otherwise, return the formatted date
    const options = { year: "numeric", month: "short", day: "numeric" };
    return dateObj.toLocaleDateString(undefined, options);
  }

  return (
    <div className="cntldcfs">
      {status === "loading" && <LoadingSpinner />}

      <span className="hdfdt">Reported Issues</span>
      {groupedData
        ?.slice()
        .reverse()
        .map((listData, index) => (
          <div className="ctListDataInd" key={index}>
            <div className="rfri">
              <span>Title:</span>
              <p>{listData?.title}</p>
            </div>
            <span>Issue:</span>
            <p>{listData.description}</p>
            <span>Issue Reported Time:</span>
            <p>{formatDateTime(listData.submit_time)}</p>
          </div>
        ))}
    </div>
  );
};

export default ReportedIssuesList;
