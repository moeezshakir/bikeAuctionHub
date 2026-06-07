import React, { useState, useEffect } from "react";
import "../homeCSS/Auction-Page-Style/auctionPost.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchAcceptedAuctionData } from "../../../api/actions/auctionActions";

const AuctionSlotData = ({ list }) => {
  // const [comments, setComments] = useState(slot?.participants);
  // const [newPrize, setNewPrize] = useState("");
  return (
    <>
      <h5>Bike Info</h5>
      <div className="bike-images">
        {list?.image_1 !== null && (
          <img
            src={`/api/php/${list?.image_1}`}
            alt={"image"}
            className="bike-image"
          />
        )}
        {list?.image_2 !== null && (
          <img
            src={`/api/php/${list?.image_2}`}
            alt={"image"}
            className="bike-image"
          />
        )}
        {list?.image_3 !== null && (
          <img
            src={`/api/php/${list?.image_3}`}
            alt={"image"}
            className="bike-image"
          />
        )}
        {list?.image_4 !== null && (
          <img
            src={`/api/php/${list?.image_4}`}
            alt={"image"}
            className="bike-image"
          />
        )}
      </div>
      <div className="bikeInfo">
        <p>Lowest Price: ${list?.lowest_prize}</p>
        <p>Highest Price: ${list?.highest_prize}</p>
      </div>

      <h3>Participants</h3>
      <ul>
        {/* {slot.participants.map((participant, index) => (
          <li key={index}>
            <div className="participantTag">
              <div className="pName">{participant.name}: </div>
              <p> {participant.prize}</p>
              <button>Accept</button>
            </div>
          </li>
        ))} */}
      </ul>
      <div>
        {/* <input
          type="text"
          value={newPrize}
          onChange={(e) => setNewPrize(e.target.value)}
        />
        <button onClick={handleSetPrize}>Set Prize</button> */}
      </div>
    </>
  );
};

const OwnedCreatedSlot = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, userAuctionData } = useSelector(
    (state) => state.auctionSlice
  );

  const [slots, setSlots] = useState(null);

  useEffect(() => {
    dispatch(fetchAcceptedAuctionData(user?.user_id));
  }, []);

  useEffect(() => {
    if (userAuctionData !== null) {
      console.log("userAuctionData", userAuctionData);
      setSlots(userAuctionData);
    }
  }, [userAuctionData]);

  return (
    <div className="ownedCreated">
      <h4>Owned Created Slots</h4>
      <div className="slotCover">
        {slots?.map((list, index) => (
          <div className="auctionSlotPost" key={index}>
            <h2>Slot {index + 1}</h2>
            <AuctionSlotData list={list} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnedCreatedSlot;
