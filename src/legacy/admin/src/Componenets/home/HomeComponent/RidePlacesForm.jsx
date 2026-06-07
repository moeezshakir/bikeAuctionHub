import React, { useState, useEffect } from "react";
import "./HomeCSS/RidePlacesForm.css";
import {
  updateRideDetails,
  getRideLocations,
} from "../../../api/actions/authActions";
import { useDispatch, useSelector } from "react-redux";

const RidePlacesForm = () => {
  const dispatch = useDispatch();
  const { user, rideLocations } = useSelector((state) => state.auth);

  const [ridePlaces, setRidePlaces] = useState({
    store_id: user?.store_id,
    location_1: "",
    location_2: "",
    location_3: "",
    location_4: "",
    location_5: "",
    location_6: "",
    location_7: "",
    location_8: "",
  });

  const [ridePlacesEdit, setRidePlacesEdit] = useState(false);

  useEffect(() => {
    dispatch(getRideLocations(user?.store_id));
  }, []);

  useEffect(() => {
    if (rideLocations !== null) {
      console.log(rideLocations);
      setRidePlaces({
        location_1: rideLocations?.[0]?.location_1,
        location_2: rideLocations?.[0]?.location_2,
        location_3: rideLocations?.[0]?.location_3,
        location_4: rideLocations?.[0]?.location_4,
        location_5: rideLocations?.[0]?.location_5,
        location_6: rideLocations?.[0]?.location_6,
        location_7: rideLocations?.[0]?.location_7,
        location_8: rideLocations?.[0]?.location_8,
      });
    }
  }, [rideLocations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRidePlaces({ ...ridePlaces, [name]: value });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    setRidePlacesEdit(true);
  };

  const handleCancelEdit = (e) => {
    e.preventDefault();
    setRidePlacesEdit(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saved data:", ridePlaces);
    dispatch(updateRideDetails(ridePlaces));
    setRidePlacesEdit(false);
  };

  return (
    <div className="ride-places-form">
      <h3>Ride Places</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Location 1:</label>
          <input
            type="text"
            name="location_1"
            value={ridePlaces.location_1}
            onChange={handleChange}
            disabled={!ridePlacesEdit}
          />
        </div>
        <div>
          <label>Location 2:</label>
          <input
            type="text"
            name="location_2"
            value={ridePlaces.location_2}
            onChange={handleChange}
            disabled={!ridePlacesEdit}
          />
        </div>
        <div>
          <label>Location 3:</label>
          <input
            type="text"
            name="location_3"
            value={ridePlaces.location_3}
            onChange={handleChange}
            disabled={!ridePlacesEdit}
          />
        </div>
        <div>
          <label>Location 4:</label>
          <input
            type="text"
            name="location_4"
            value={ridePlaces.location_4}
            onChange={handleChange}
            disabled={!ridePlacesEdit}
          />
        </div>
        <div>
          <label>Location 5:</label>
          <input
            type="text"
            name="location_5"
            value={ridePlaces.location_5}
            onChange={handleChange}
            disabled={!ridePlacesEdit}
          />
        </div>
        <div>
          <label>Location 6:</label>
          <input
            type="text"
            name="location_6"
            value={ridePlaces.location_6}
            onChange={handleChange}
            disabled={!ridePlacesEdit}
          />
        </div>
        <div>
          <label>Location 7:</label>
          <input
            type="text"
            name="location_7"
            value={ridePlaces.location_7}
            onChange={handleChange}
            disabled={!ridePlacesEdit}
          />
        </div>
        <div>
          <label>Location 8:</label>
          <input
            type="text"
            name="location_8"
            value={ridePlaces.location_8}
            onChange={handleChange}
            disabled={!ridePlacesEdit}
          />
        </div>
        {!ridePlacesEdit && <button onClick={handleEdit}>Edit</button>}
        {ridePlacesEdit && <button type="submit">Save</button>}
        {ridePlacesEdit && <button onClick={handleCancelEdit}>Cancel</button>}
      </form>
    </div>
  );
};

export default RidePlacesForm;
