"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const storeIcon = divIcon({
  className: "",
  html: '<div class="map-marker"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function RideStoreMap({ stores = [], selectedStore, onSelectStore }) {
  const center = useMemo(() => {
    const focus = selectedStore || stores[0];
    const lat = Number(focus?.location?.latitude || 31.5497);
    const lng = Number(focus?.location?.longitude || 74.3436);
    return [lat, lng];
  }, [selectedStore, stores]);

  return (
    <div className="map-shell">
      <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution={tileAttribution} url={tileUrl} />
        {stores.map((store) => {
          const lat = Number(store?.location?.latitude);
          const lng = Number(store?.location?.longitude);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }

          return (
            <Marker
              icon={storeIcon}
              key={store._id}
              position={[lat, lng]}
              eventHandlers={{
                click: () => onSelectStore?.(store),
              }}
            >
              <Popup>
                <strong>{store.storeName}</strong>
                <br />
                {store.location?.address || store.location?.city}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
