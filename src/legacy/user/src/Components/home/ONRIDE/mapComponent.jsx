import React, { useState, useEffect } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import { getMapIcon } from "../../../utils/CommonUtils";
import Ellipse from "../../../assets/Images/Ellipse.png";

const MapWithUserLocation = ({
  user,
  onLocationFound,
  searchedLocation,
  setOriginalPosition,
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geo location not working in your browser");
      onLocationFound(null);
    } else {
      if (searchedLocation) {
        // If a searched location is provided, fly to that location
        map.flyTo(
          [searchedLocation.latitude, searchedLocation.longitude],
          map.getZoom()
        );
        return; // Return early to prevent fetching user's location
      }

      // Get user's current location using browser's geolocation API
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
          map.flyTo(
            [position.coords.latitude, position.coords.longitude],
            map.getZoom()
          ); // Fly to user location
          onLocationFound(position);
          // Set original position when the map is created
          setOriginalPosition([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => {
          console.error("Error getting user location:", error);
          onLocationFound(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    }
  }, [map, searchedLocation]); // Run when the map instance or searchedLocation changes

  const handleReturnToOriginalPosition = () => {
    // Fly back to the original position
    const originalPosition = [
      userLocation.coords.latitude,
      userLocation.coords.longitude,
    ];
    map.flyTo(originalPosition, map.getZoom());
  };

  return userLocation ? (
    <Marker
      position={[userLocation.coords.latitude, userLocation.coords.longitude]}
      icon={getMapIcon(user != null ? user.image : Ellipse)}
    >
      <Popup>You are here</Popup>
    </Marker>
  ) : null;
};

export default MapWithUserLocation;
