import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import L from "leaflet";
import { logoutUser } from "../api/reducerSlices/authSlice";

export const setToken = (token) => {
  localStorage.setItem("userToken", token);
};

export const getToken = () => {
  const userToken = localStorage.getItem("userToken");
  if (userToken !== null && userToken !== undefined) {
    return localStorage.getItem("userToken");
  }
};

export const resetAllOnLogout = (dispatch) => {
  // localStorage.removeItem("userToken");
  dispatch(logoutUser());
};

export const deleteToken = () => {
  localStorage.removeItem("token");
};

export const downloadPDF = (pdfRef) => {
  const input = pdfRef.current;
  if (!input) {
    console.error("PDF container element not found");
    return;
  }

  const downloadButton = document.querySelector(".downloadbtn");
  if (downloadButton) {
    downloadButton.style.display = "none";
  }

  html2canvas(input, { scrollY: -window.scrollY })
    .then((canvas) => {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const aspectRatio = imgWidth / imgHeight;

      let imgHeightNew = pdfHeight;
      let imgWidthNew = pdfWidth;

      if (imgWidth > pdfWidth || imgHeight > pdfHeight) {
        if (aspectRatio > 1) {
          imgHeightNew = pdfWidth / aspectRatio;
        } else {
          imgWidthNew = pdfHeight * aspectRatio;
        }
      }

      const imgX = (pdfWidth - imgWidthNew) / 2;
      const imgY = 10; // Start content from top with a margin of 10mm

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        imgX,
        imgY,
        imgWidthNew,
        imgHeightNew
      );
      pdf.save("invoice.pdf");

      if (downloadButton) {
        downloadButton.style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Error generating PDF:", error);

      if (downloadButton) {
        downloadButton.style.display = "block";
      }
    });
};

export const MapAPIKEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export const getMapIcon = (url, bikeleft) => {
  const icon = L.divIcon({
    html: `
      <div style="position: relative; width: 40px; height: 40px; background: none" >
        <img src="${url}" style="width: 100%; height: 100%; background-size: cover;" />
        <div style="
        position: absolute;
        top: -12px;
        right: -3px;
        transform: translateX(-50%);
        background-color:${bikeleft > 0 ? "#007bff" : "#ff0000"};;
        color: #fff;
        padding: 0px 3px;
        border-radius: 3px;
        font-size: 12px;
        ">
          ${bikeleft}
        </div>
      </div>
    `,
    // iconSize: [40, 40],
    // iconAnchor: [20, 40], // Adjust the icon anchor to properly position the icon
  });
  return icon;
};

export const MAP_TILE_LAYER_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?lang=en";
export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const getCityNameFromCurrentLocation = async (position) => {
  // console.log("heloo for api " + JSON.stringify(position));
  const latitude = position?.coords?.latitude;
  const longitude = position?.coords?.longitude;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${MapAPIKEY}`;

  try {
    const response = await fetch(url).then((r) => r.json());
    const city = response.results[0].address_components.find((component) =>
      component.types.includes("locality")
    ).long_name;
    // console.log(`Your city is ${city}.`);
    return city;
  } catch (error) {
    console.log("error: ", error);
  }
  return null;
};
