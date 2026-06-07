import "./homeCSS/BikeAds.css";
import adsImage from "../../assets/Images/bg3.jpg";

const BikeAds = () => {
  return (
    <div className="container">
      <div className="row ads-container">
        <div className="col-12">
          <div className="row">
            <div className="col-8 ads-left">
              <h3>Bike Auction Hub</h3>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Deleniti, amet?
              </p>
              {/* <button className="btn ride-btn">Send Now</button> */}
            </div>
            <div className="col-4 ads-right">
              <img src={adsImage} alt="Bike Auction Hub ads" />
              <span>Ads</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeAds;
