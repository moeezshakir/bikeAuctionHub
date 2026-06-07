import React, { useState, useEffect } from "react";
import "./navbar.css";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../utils/AppConstants";
// import ListIcon from "../../../assets/svgs/ListIcon";
import Ellipse from "../../../assets/Images/Ellipse.png";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import { useDispatch, useSelector } from "react-redux";

const NavBar = ({
  sidebarToggle,
  setSideBarCloseIfOpen,
  openProfileTab,
  logoutFuncInNav,
  imageChange,
  imageForNav,
  csbiss,
}) => {
  const { user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [image, setImage] = useState(
    imageForNav === user?.profile_pic
      ? `/api/php/${user?.profile_pic}`
      : `/api/php/${imageForNav}`
  );

  const handleOpenUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const onNavHeading = () => {
    localStorage.setItem("activeTab", APP_ROUTES.HOME_ROUTE);
    // window.location.reload();
    setSideBarCloseIfOpen();
  };

  // useEffect(() => {
  //   console.log(user);
  //   if (imageChange !== true && imageForNav === null) {
  //     setImage(
  //       `/api/php/${user?.profile_pic}`
  //     );
  //   }
  // }, []);

  useEffect(() => {
    console.log(user);
    if (imageChange === true && imageForNav !== null) {
      setImage(
        `/api/php/${imageForNav}`
      );
      csbiss();
    }
  }, [imageChange]);

  return (
    <div className="navbarOuter">
      {/* <div className="navbar">
        <div className="listBar" onClick={sidebarToggle}>
          <ListIcon />
        </div>
        <Link key={"home"} to={APP_ROUTES.HOME_ROUTE} onClick={onNavHeading}>
          Bike Auction Hub
        </Link>
      </div> */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={sidebarToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link
              to={APP_ROUTES.HOME_ROUTE}
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={onNavHeading}
            >
              Bike Auction Hub
            </Link>
          </Typography>
          {/* <Tooltip title="User menu">
            <IconButton onClick={handleOpenUserMenu} sx={{ ml: 2 }}>
              <Avatar alt="Moeez" src={image} />
            </IconButton>
          </Tooltip> */}
          <MenuItem onClick={(handleCloseUserMenu, logoutFuncInNav)}>
            Logout
          </MenuItem>
        </Toolbar>
        {/* <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseUserMenu}
          onClick={(handleCloseUserMenu, logoutFuncInNav)}
        > */}
        {/* <MenuItem onClick={(handleCloseUserMenu, openProfileTab)}> */}
        {/* My Profile */}
        {/* </MenuItem> */}
        {/* <MenuItem onClick={(handleCloseUserMenu, logoutFuncInNav)}>
          Logout
        </MenuItem> */}
        {/* </Menu> */}
      </AppBar>
    </div>
  );
};

export default NavBar;
