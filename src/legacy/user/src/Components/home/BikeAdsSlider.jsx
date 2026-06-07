import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./homeCSS/BikeAdsSlider.css";
import adsImage1 from "../../assets/Images/motorcycle.png";
import adsImage2 from "../../assets/Images/motorbike.png";
import adsImage3 from "../../assets/Images/motorbike2.png";

const BikeAdsSlider = () => {
  const slides = [
    {
      image: adsImage1,
      heading: "Discover the City on Two Wheels",
      content:
        "Rent our bikes for affordable and convenient city rides. Enjoy easy booking, available anytime, anywhere. Explore your urban adventure with hassle-free rentals. Experience the city on your terms today!",
    },
    {
      image: adsImage2,
      heading: "Adventure Awaits",
      content:
        "Embark on thrilling adventures with our rugged adventure bikes. Discover new landscapes and conquer challenging trails. Book your ride today and unleash your inner explorer!",
    },
    {
      image: adsImage3,
      heading: "Sell Your Bike Easily",
      content:
        "List your bike on our platform and connect with potential buyers swiftly. Reach a wide audience seeking quality bikes. Sell hassle-free and get the best value for your ride. List your bike today!",
    },
  ];

  const settings = {
    dots: true,
    dotsClass: "slick-dots left",
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  console.log("BikeAdsSlider component rendered with slides:", slides);

  return (
    <div className="container">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div key={index} className="row">
            <div className="col-12">
              <div className="row ads-container">
                <div className="col-md-8">
                  <h3>{slide.heading}</h3>
                  <p>{slide.content}</p>
                </div>
                <div className="col-md-4 ads-right">
                  <img src={slide.image} alt={`Bike Auction Hub ad ${index}`} />
                  <span>Ads</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default BikeAdsSlider;
