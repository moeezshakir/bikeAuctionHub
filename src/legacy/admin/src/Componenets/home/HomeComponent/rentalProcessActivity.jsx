import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBikeDetails,
  updateBikeDetails,
  addNewBike,
  finishRide,
  deleteBikeCell,
} from "../../../api/actions/authActions";
import { resetError } from "../../../api/reducerSlices/authSlice";
import LoadingSpinner from "../../../utils/LoadingSpinner";
import "./HomeCSS/BikeDetails.css";
import RidePlacesForm from "./RidePlacesForm";

const RentalProcessActivity = () => {
  const { status, user, bikeDetails, bikeadded, bikeCellDelete, rideFinished } =
    useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [groupedData, setGroupedData] = useState(null);
  const [newBikeFormOpen, setNewBikeFormOpen] = useState(false);
  const [newBikeData, setNewBikeData] = useState({
    type: "",
    imageUrl: "",
    pricePerHour: "",
    bikeBookingStatus: "available", // Default status for a new bike
  });
  const [image, setImage] = useState(null);
  const [editableBike, setEditableBike] = useState(null);

  useEffect(() => {
    dispatch(fetchBikeDetails(user?.store_id));
  }, []);

  useEffect(() => {
    if (bikeadded === true) {
      alert("bike added!");
      dispatch(fetchBikeDetails(user?.store_id));
    }
  }, [bikeadded]);

  useEffect(() => {
    if (bikeCellDelete === true) {
      alert("bike cell delete!");
      dispatch(fetchBikeDetails(user?.store_id));
    }
  }, [bikeCellDelete]);

  useEffect(() => {
    if (rideFinished === true) {
      dispatch(fetchBikeDetails(user?.store_id));
    }
  }, [rideFinished]);

  useEffect(() => {
    if (bikeDetails) {
      setGroupedData(bikeDetails);
      dispatch(resetError());
    }
    console.log(groupedData);
  }, [bikeDetails]);

  function formatDateTime(datetime) {
    const dateObj = new Date(datetime);
    const now = new Date();

    if (dateObj.toDateString() === now.toDateString()) {
      return "Today";
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    const options = { year: "numeric", month: "short", day: "numeric" };
    return dateObj.toLocaleDateString(undefined, options);
  }

  const handleEditBike = (bike) => {
    setEditableBike(bike);
    setNewBikeData({
      type: bike?.type,
      imageUrl: "",
      pricePerHour: bike?.pricePerHour,
      bikeBookingStatus: bike?.bikeBookingStatus,
    });
    // console.log(editableBike);
  };

  const handleCancelEdit = () => {
    setEditableBike(null);
  };

  const handleSaveChanges = () => {
    if (editableBike) {
      let objectToSend = {
        bikeId: editableBike?.id,
        storeId: user?.store_id,
        type: newBikeData.type,
        imageUrl: editableBike.imageUrl,
        pricePerHour: newBikeData.pricePerHour,
        bikeBookingStatus: newBikeData.bikeBookingStatus,
      };
      console.log(objectToSend);
      dispatch(updateBikeDetails(objectToSend));
      setNewBikeData({
        type: "",
        imageUrl: "",
        pricePerHour: "",
        bikeBookingStatus: "available",
      });
      setEditableBike(null); // Clear editable bike after edit
    }
  };

  const handleFinishRide = (bike) => {
    console.log(bike);

    let dataToSend = {
      bikeId: bike?.id,
      store_id: bike?.store_id,
      userId: bike?.booking?.userId,
    };
    dispatch(finishRide(dataToSend));
  };

  const handleNewBikeSubmit = () => {
    if (
      newBikeData.type === "" ||
      image === null || // Check if image is selected
      newBikeData.pricePerHour === ""
    ) {
      alert("Please fill in all required fields!");
      return;
    }

    let formData = new FormData();
    formData.append("storeId", user?.store_id);
    formData.append("type", newBikeData.type);
    formData.append("pricePerHour", newBikeData.pricePerHour);
    formData.append("bikeBookingStatus", newBikeData.bikeBookingStatus);
    formData.append("image", image); // Append the image file to FormData
    console.log([...formData]); // Convert FormData to an array for logging
    dispatch(addNewBike(formData)); // Send FormData with image data
    setNewBikeFormOpen(false); // Close the form after submission
    setNewBikeData({
      type: "",
      imageUrl: "",
      pricePerHour: "",
      bikeBookingStatus: "available",
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBikeData({ ...newBikeData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
      setImage(file); // Set the file state for FormData
    }
  };

  const handleDeleteBike = (bike) => {
    let dataToSend = {
      bikeId: bike?.id,
      storeId: user?.store_id,
    };
    console.log(dataToSend);
    dispatch(deleteBikeCell(dataToSend));
  };

  return (
    <>
      {status === "loading" && <LoadingSpinner />}
      <div className="bikeDetailsContainer">
        <RidePlacesForm storeId={user?.store_id} />
        <p>
          <br />
          <br />
          Toatal Bikes: {groupedData?.length}
          <br />
          <br />
        </p>
        {/* <p>Available Bikes: {groupedData?.length}</p>
      <p>Booked Bikes: {groupedData?.length}</p> */}
        <button onClick={() => setNewBikeFormOpen(!newBikeFormOpen)}>
          {newBikeFormOpen ? "Cancel Add Bike" : "Add New Bike"}
        </button>

        {newBikeFormOpen && (
          <div className="newBikeForm">
            <h3>Add New Bike</h3>
            <label>Type:</label>
            <input
              type="text"
              value={newBikeData.type}
              onChange={(e) =>
                setNewBikeData({ ...newBikeData, type: e.target.value })
              }
            />
            <label>Image:</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {newBikeData.imageUrl && (
              <img src={newBikeData.imageUrl} alt="Bike" width="100" />
            )}
            <label>Price per Hour:</label>
            <input
              type="text"
              value={newBikeData.pricePerHour}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "");
                setNewBikeData({
                  ...newBikeData,
                  pricePerHour: e.target.value,
                });
              }}
            />
            <button onClick={handleNewBikeSubmit}>Add Bike</button>
          </div>
        )}

        {groupedData?.map((bike, index) => (
          <div className="bikeDetailItem" key={index}>
            <div className="bikeInfo">
              <span>Type:</span>
              {editableBike === bike ? (
                <input
                  style={{ padding: " 4px 10px" }}
                  type="text"
                  value={newBikeData?.type}
                  onChange={(e) =>
                    setNewBikeData({ ...newBikeData, type: e.target.value })
                  }
                />
              ) : (
                <p>{bike.type}</p>
              )}

              {bike?.imageUrl && (
                <div className="bImg">
                  <img
                    src={`/api/php/${bike?.imageUrl}`}
                    alt="Bike"
                    width="100"
                  />
                </div>
              )}

              <span>Price per Hour:</span>
              {editableBike === bike ? (
                <input
                  style={{ padding: " 4px 10px" }}
                  type="number"
                  value={newBikeData?.pricePerHour}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                    setNewBikeData({
                      ...newBikeData,
                      pricePerHour: e.target.value,
                    });
                  }}
                />
              ) : (
                <p>{bike.pricePerHour} Rp</p>
              )}

              <span>Booking Status:</span>
              {editableBike === bike ? (
                <select
                  style={{ padding: " 4px 8px" }}
                  value={newBikeData?.bikeBookingStatus}
                  onChange={(e) =>
                    setNewBikeData({
                      ...newBikeData,
                      bikeBookingStatus: e.target.value,
                    })
                  }
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              ) : (
                <p>{bike.bikeBookingStatus}</p>
              )}
            </div>

            {bike.booking && (
              <div className="bookingInfo">
                <h3>Booking Details</h3>
                <span>User ID:</span>
                <p>{bike.booking.userId}</p>
                <span>Bike ID:</span>
                <p>{bike.booking.bikeId}</p>
                <span>Location:</span>
                <p>{bike.booking.location}</p>
                <span>Start Time:</span>
                <p>{formatDateTime(bike.booking.startTime)}</p>
                <span>End Time:</span>
                <p>{formatDateTime(bike.booking.endTime)}</p>
                <span>Status:</span>
                <p>{bike.booking.bookingStatus}</p>
                <button onClick={() => handleFinishRide(bike)}>
                  Finish Ride
                </button>
              </div>
            )}

            {editableBike === bike ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleSaveChanges}>Save Changes</button>
                <button onClick={handleCancelEdit}>Cancel Edit</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => handleEditBike(bike)}>Edit Bike</button>
                {editableBike !== bike && (
                  <button onClick={() => handleDeleteBike(bike)}>
                    Delete Cell
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default RentalProcessActivity;
