import React from "react";
import MoveBackIcon from "../../../assets/svgs/MoveBackIcon";
import SettingContentData from "../../../utils/json/settingsContent.json";
require("../homeCSS/Settings-Style/settingsContent.css");

const SettingsContent = ({ settingContentPageContent, goBack }) => {
  const { title, sections: pageContent } =
    SettingContentData[settingContentPageContent];

  return (
    <div className="settingsTilesContent">
      <div className="header">
        <div className="moveBack" onClick={goBack}>
          <MoveBackIcon />
        </div>
        <span>{title}</span>
      </div>
      <div className="contentBox">
        {pageContent?.map((section, index) => (
          <div className="section" key={index}>
            <span>{section.section_title}</span>
            <p>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsContent;
