import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  getAuctionData,
  updateAuctionStatus,
} from "../../../api/actions/authActions";
import "./HomeCSS/auctionProcessActivity.css";
import LoadingSpinner from "../../../utils/LoadingSpinner";

const AuctionProcessActivity = () => {
  const dispatch = useDispatch();
  const { status, user, auctionData, auctionStatusApplied } = useSelector(
    (state) => state.auth
  );

  const [auctionPendingList, setAuctionPendingList] = useState([]);

  useEffect(() => {
    dispatch(getAuctionData());
  }, []);

  useEffect(() => {
    if (auctionData !== null) {
      setAuctionPendingList(auctionData);
    }
  }, [auctionData]);

  useEffect(() => {
    if (auctionStatusApplied === true) {
      dispatch(getAuctionData());
    }
  }, [auctionStatusApplied]);

  const handleCreate = (auctionId, userId) => {
    let id = auctionId;
    dispatch(updateAuctionStatus({ id, userId, status: "Accepted" }));
  };

  const handleAbort = (auctionId, userId) => {
    let id = auctionId;
    dispatch(updateAuctionStatus({ id, userId, status: "Abort" }));
  };

  return (
    <>
      {status === "loading" && <LoadingSpinner />}
      <div className="auctionListContaier">
        {auctionPendingList?.map((list) => (
          <div key={list.id} className="auctionListItem">
            <h4 className="prt" style={{ display: "flex" }}>
              From {list.username}
            </h4>
            <div className="imageBox">
              {list?.image_1 !== null && (
                <img
                  src={`/api/php/${list?.image_1}`}
                  alt={"image"}
                />
              )}
              {list?.image_2 !== null && (
                <img
                  src={`/api/php/${list?.image_2}`}
                  alt={"image"}
                />
              )}
              {list?.image_3 !== null && (
                <img
                  src={`/api/php/${list?.image_3}`}
                  alt={"image"}
                />
              )}
              {list?.image_4 !== null && (
                <img
                  src={`/api/php/${list?.image_4}`}
                  alt={"image"}
                />
              )}
            </div>
            <div className="aucbidInfo">
              <div className="lgpz">
                Highest price: {list?.highest_prize} Rp
                <br />
              </div>
              <div className="lwpz">
                Lowest price: {list?.lowest_prize} Rp
                <br />
              </div>
            </div>
            <Grid container spacing={2}>
              <Box className="auctionListItemButton">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleCreate(list?.id, list?.user_id)}
                >
                  Create
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleAbort(list?.id, list?.user_id)}
                >
                  Abort
                </Button>
              </Box>
            </Grid>
          </div>
        ))}
      </div>
    </>
  );
};

export default AuctionProcessActivity;
