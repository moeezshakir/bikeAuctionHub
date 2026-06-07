import React, { useState, useEffect } from "react";
import "../homeCSS/Auction-Page-Style/auctionPost.css";
import { fetchOtherUserAuctionData } from "../../../api/actions/auctionActions";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";

const AuctionSlotData = ({ list }) => {
  const [comments, setComments] = useState(list?.participants || []);
  const [newPrize, setNewPrize] = useState("");

  const handleSetPrize = () => {
    const newPrizeNumber = parseFloat(newPrize);
    if (
      newPrizeNumber >= list?.lowest_prize &&
      newPrizeNumber <= list?.highest_prize
    ) {
      const newComment = {
        _id: `comment${comments.length + 1}_id`, 
        name: "newParticipant",
        prize: newPrizeNumber,
      };
      setComments([...comments, newComment]);
      setNewPrize("");
    } else {
      alert("Please set prize under lowest and highest.");
    }
  };

  return (
    <>
      <h5>Bike Info</h5>
      <div className="bike-images">
        {list?.image_1 && (
          <img
            src={`/api/php/${list?.image_1}`}
            alt="image"
            className="bike-image"
          />
        )}
        {list?.image_2 && (
          <img
            src={`/api/php/${list?.image_2}`}
            alt="image"
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
        {comments.map((participant, index) => (
          <li key={participant._id}>
            <div className="participantTag">
              <div className="pName">{participant.name}: </div>
              <p>{participant.prize}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="setPrize">
        <input
          type="number"
          value={newPrize}
          onChange={(e) => setNewPrize(e.target.value)}
        />
        <button onClick={handleSetPrize}>Set Prize</button>
      </div>
    </>
  );
};

AuctionSlotData.propTypes = {
  list: PropTypes.shape({
    participants: PropTypes.array,
    lowest_prize: PropTypes.number,
    highest_prize: PropTypes.number,
    image_1: PropTypes.string,
    image_2: PropTypes.string,
  }).isRequired,
};

const CreatedSlotByOtherUsers = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { otherUserAuctionData } = useSelector((state) => state.auctionSlice);

  const [slots, setSlots] = useState([]);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(fetchOtherUserAuctionData(user.user_id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (otherUserAuctionData) {
      setSlots(otherUserAuctionData);
    }
  }, [otherUserAuctionData]);

  return (
    <div className="slotUpperCover">
      <h4>Created Slot By Other Users</h4>
      <div className="slotCover">
        {slots.map((list, index) => (
          <div className="auctionSlotPost" key={index}>
            <h2>Slot {index + 1}</h2>
            <AuctionSlotData list={list} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatedSlotByOtherUsers;
