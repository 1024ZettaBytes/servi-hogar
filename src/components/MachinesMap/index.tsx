import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 25.5693347,
  lng: -108.4747794,
};

function MapsComponent({ rentsList, mapsApiKey }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: mapsApiKey,
  });

  return isLoaded ? (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10} >
      {rentsList.map((rent) => (
        <Marker
          key={rent?._id}
          label={`${rent?.machine?.machineNum}`}
          position={rent?.customer?.currentResidence?.coordinates}
          icon={{
            url:"/static/images/wm.svg",
            scaledSize: new google.maps.Size(35, 35)
        }}  
        />
      ))}
    </GoogleMap>
  ) : (
    <></>
  );
}

export default React.memo(MapsComponent);
