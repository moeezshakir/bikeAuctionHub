import React, { useState, useEffect } from "react";
import "../homeCSS/OnRide-Style/storePage.css";
import MoveBackIcon from "../../../assets/svgs/MoveBackIcon";
import BikeImage from "../../../assets/Images/bikeImage.jpg";

//libraries
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useDispatch, useSelector } from "react-redux";
import {
  getBikeData,
  bookBike,
  getRideLocations,
} from "../../../api/actions/homeActions";
import { resetState2 } from "../../../api/reducerSlices/homeSlice";

const StorePage = ({
  storeIdForgl,
  selectedStoreData,
  goBack,
  ridebookfnc,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, bikesData, bookingStatus, rideLocations } =
    useSelector((state) => state.homeSlice);

  const [bikes, setBikes] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedBike, setSelectedBike] = useState(null);
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [ridePlaces, setRidePlaces] = useState({
    location_1: "",
    location_2: "",
    location_3: "",
    location_4: "",
    location_5: "",
    location_6: "",
    location_7: "",
    location_8: "",
  });

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

  useEffect(() => {
    console.log(selectedStoreData);
    let _id = selectedStoreData?._id;
    dispatch(getBikeData(_id));
  }, []);

  useEffect(() => {
    console.log("hello", bikesData);
    const availableBikes = bikesData?.bikes?.filter(
      (bike) => bike.bikeBookingStatus.trim() === "available"
    );
    setBikes(availableBikes);
  }, [bikesData]);

  useEffect(() => {
    if (bookingStatus === "succeeded") {
      setSelectedBike(null);
      setLocation("");
      setDuration("");
      setStartTime("");
      setEndTime("");
      setPrice(0);
      goBack();
      ridebookfnc();
      alert("Bike booked on rent, Enjoy the ride");
      dispatch(resetState2());
    }
  }, [bookingStatus]);

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

  const handleCardClick = (bike) => {
    setSelectedBike(bike);
  };

  const handleDurationChange = (event) => {
    const selectedDuration = event.target.value;
    setDuration(selectedDuration);

    if (selectedBike) {
      const now = new Date();
      const start = new Date(now.getTime() + selectedDuration * 60000); // Calculate end time in milliseconds

      // Format start and end times
      const formattedStartTime = `${start.getHours()}:${start.getMinutes()}`;
      const end = new Date(now.getTime() + (selectedDuration + 30) * 60000);
      const formattedEndTime = `${end.getHours()}:${end.getMinutes()}`;

      setStartTime(formattedStartTime);
      setEndTime(formattedEndTime);

      const totalPrice = selectedBike.pricePerHour * selectedDuration;
      setPrice(totalPrice);
    }
  };

  const handleStartTimeChange = (event) => {
    setStartTime(event.target.value);
  };

  const handleBookRide = () => {
    if (!location || !duration || !startTime) {
      setErrorMessage("Please select location, duration, and start time.");
      alert(errorMessage);
      return;
    }

    const bookingDetails = {
      userId: user?.user_id,
      bikeId: selectedBike.id,
      duration: duration,
      location: location,
      startTime: startTime,
      endTime: endTime,
    };
    console.log(bookingDetails);
    dispatch(bookBike(bookingDetails));
  };

  const renderBikeCards = () => {
    let filteredBikes = bikes;
    if (selectedType !== "All") {
      filteredBikes = bikes.filter((bike) => bike.type === selectedType);
    }
    return filteredBikes?.map((bike) => (
      <Card key={bike.id} className="bike-card">
        <CardMedia
          component="img"
          alt={bike.type}
          height="140"
          image={`/api/php/${bike?.imageUrl}`}
          // image={BikeImage}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {bike.type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Price per Hour: {bike.pricePerHour} Rp
          </Typography>
        </CardContent>
        <CardActions>
          {bike.bikeBookingStatus.trim() === "available" ? (
            <Button size="small" onClick={() => handleCardClick(bike)}>
              Book For Ride
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Booked
            </Typography>
          )}
        </CardActions>
      </Card>
    ));
  };

  const closeBookingForm = () => {
    setSelectedBike(null);
    setLocation("");
    setDuration("");
    setStartTime("");
    setEndTime("");
    setPrice(0);
  };

  const renderBookingForm = () => {
    if (selectedBike) {
      return (
        <div className="bookingFormOverlay">
          <div className="booking-form">
            <div className="header">
              <div className="moveBack" onClick={closeBookingForm}>
                <MoveBackIcon />
              </div>
              Book now
            </div>
            <h2>{selectedBike.type}</h2>
            <FormControl fullWidth>
              <InputLabel id="location-label">Location</InputLabel>
              <Select
                labelId="location-label"
                id="location-select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <MenuItem value={ridePlaces?.location_1}>
                  {ridePlaces?.location_1}
                </MenuItem>
                <MenuItem value={ridePlaces?.location_2}>
                  {ridePlaces?.location_2}
                </MenuItem>
                <MenuItem value={ridePlaces?.location_3}>
                  {ridePlaces?.location_3}
                </MenuItem>
                <MenuItem value={ridePlaces?.location_4}>
                  {ridePlaces?.location_4}
                </MenuItem>
                <MenuItem value={ridePlaces?.location_5}>
                  {ridePlaces?.location_5}
                </MenuItem>
                <MenuItem value={ridePlaces?.location_6}>
                  {ridePlaces?.location_6}
                </MenuItem>
                <MenuItem value={ridePlaces?.location_7}>
                  {ridePlaces?.location_7}
                </MenuItem>
                <MenuItem value={ridePlaces?.location_8}>
                  {ridePlaces?.location_8}
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="duration-label">Duration</InputLabel>
              <Select
                labelId="duration-label"
                id="duration-select"
                value={duration}
                onChange={handleDurationChange}
              >
                <MenuItem value={1}>1 hour</MenuItem>
                <MenuItem value={2}>2 hours</MenuItem>
                <MenuItem value={3}>3 hours</MenuItem>
                <MenuItem value={4}>4 hours</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="start-time-label">Ride start time</InputLabel>
              <Select
                labelId="start-time-label"
                id="start-time-select"
                value={startTime}
                onChange={handleStartTimeChange}
              >
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
                <MenuItem value={90}>1 hour 30 minutes</MenuItem>
                <MenuItem value={120}>2 hours</MenuItem>
                <MenuItem value={150}>2 hours 30 minutes</MenuItem>
                {/* <MenuItem value={startTime}>{startTime}</MenuItem>
                <MenuItem value={endTime}>{endTime}</MenuItem> */}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Total Price: {price} Rp
            </Typography>
            <Button
              onClick={handleBookRide}
              variant="contained"
              color="primary"
            >
              Book Ride
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="store-page">
      <div className="stickyPosition">
        <div className="header">
          <div className="moveBack" onClick={goBack}>
            <MoveBackIcon />
          </div>
          <span>Bike Store</span>
        </div>
        <Box sx={{ minWidth: 120 }}>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Type</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedType}
              label="type"
              onChange={handleTypeChange}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Mountain Bike">Mountain Bike</MenuItem>
              <MenuItem value="Road Bike">Road Bike</MenuItem>
              <MenuItem value="City Bike">City Bike</MenuItem>
              <MenuItem value="BMX Bike">BMX Bike</MenuItem>
              <MenuItem value="Electric Bike">Electric Bike</MenuItem>
              <MenuItem value="Cruiser Bike">Cruiser Bike</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </div>
      <div className="bike-cards-container">{renderBikeCards()}</div>
      {renderBookingForm()}
    </div>
  );
};

export default StorePage;
