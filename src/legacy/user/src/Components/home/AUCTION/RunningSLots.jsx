import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import SwipeableViews from "react-swipeable-views";
import OwnedCreatedSlot from "./OwnedCreatedSlot";
import CreatedSLotByOtherUsers from "./CreatedSLotByOtherUsers";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const RunningSLots = () => {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <div className="runningSlotComp">
      <Tabs
        className="auctionNavBar"
        value={currentTab}
        onChange={(event, newValue) => setCurrentTab(newValue)}
      >
        <Tab
          label="Own Created"
          className={currentTab === 0 ? "active" : "nonactive"}
        />
        <Tab
          label="Running by Other"
          className={currentTab === 1 ? "active" : "nonactive"}
        />
      </Tabs>
      <SwipeableViews
        index={currentTab}
        onChangeIndex={(index) => setCurrentTab(index)}
      >
        <TabPanel value={currentTab} index={0}>
          {/* Content for "Owned created Slot" tab */}
          <OwnedCreatedSlot />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          {/* Content for "Running by other" tab */}
          <CreatedSLotByOtherUsers />
        </TabPanel>
      </SwipeableViews>
    </div>
  );
};

export default RunningSLots;
