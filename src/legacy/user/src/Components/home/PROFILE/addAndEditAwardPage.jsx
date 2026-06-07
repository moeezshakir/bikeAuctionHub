import React, { useState } from "react";
import "../homeCSS/Profile-Style/addAndEditAwardPage.css";
import MoveBackIcon from "../../../assets/svgs/MoveBackIcon";

const AddAndEditAwardPage = ({
  goBackToProfilePage,
  selectedAwardTileData,
  isAwardsEditable,
  onSave,
}) => {
  const [title, setTitle] = useState(
    isAwardsEditable ? selectedAwardTileData?.title : ""
  );
  const [description, setDescription] = useState(
    isAwardsEditable ? selectedAwardTileData?.description : ""
  );
  const [imagePreview, setImagePreview] = useState(
    isAwardsEditable ? selectedAwardTileData?.image : null
  );
  const [image, setImage] = useState(null);
  const [isViewAward, setIsViewAward] = useState(isAwardsEditable);
  const [isCancelEdit, setIsCancelEdit] = useState(false);
  // const [text, setText] = useState("");
  const [newData, setNewData] = useState(false);
  // const [temImage, setTemImage] = useState(null);
  const [isEditingAwardsEnable, setIsEditingAwardsEnable] = useState(
    isAwardsEditable ? false : true
  );

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const validateInputs = () => {
    if (!title || !description || !imagePreview) {
      return false;
    }
    return true;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(file);
    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const saveAward = () => {
    if (validateInputs()) {
      if (isAwardsEditable && selectedAwardTileData) {
        //when updating
      } else {
        //when creating new
        setIsEditingAwardsEnable(false);
        setIsViewAward(true);
        setNewData(selectedAwardTileData === null ? true : false);
      }
    } else {
      alert("Please fill all fields!");
    }
  };

  const editAward = () => {
    setIsEditingAwardsEnable(true);
    setIsCancelEdit(true);
  };

  const cancelEdit = () => {
    setIsEditingAwardsEnable(false);
    setIsCancelEdit(false);
  };

  const deleteAward = () => {
    goBackToProfilePage();
  };

  return (
    <div className="addAwardDetails">
      <div className="header">
        <div className="moveback" onClick={goBackToProfilePage}>
          <MoveBackIcon />
        </div>
        <div className="buttons">
          {isEditingAwardsEnable && isCancelEdit && (
            <button
              type="submit"
              className="saveButton btn"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
          {isEditingAwardsEnable && (
            <button
              type="submit"
              className="saveButton btn"
              onClick={saveAward}
            >
              {isEditingAwardsEnable && isCancelEdit ? "Update" : "Save"}
            </button>
          )}
          {!isEditingAwardsEnable && (
            <button
              type="submit"
              className="saveButton btn"
              onClick={editAward}
            >
              Edit
            </button>
          )}
          {((isAwardsEditable && selectedAwardTileData !== null) ||
            newData) && (
            <button className="deleteButton btn" onClick={deleteAward}>
              Delete
            </button>
          )}
        </div>
      </div>
      <div className="getAchievementBox">
        <div className="titleSection">
          {isViewAward && !isEditingAwardsEnable && (
            <div className="title">{title}</div>
          )}
          {isEditingAwardsEnable && (
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
        </div>
        <div className="descriptionSection">
          {isViewAward && !isEditingAwardsEnable && (
            <div className="description">{description}</div>
          )}
          {isEditingAwardsEnable && (
            <textarea
              placeholder="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </div>
        {isEditingAwardsEnable ? (
          <>
            <label htmlFor="imageInput">
              <div className="imageBox">
                {imagePreview &&
                  (typeof imagePreview === "string" &&
                  imagePreview.trim() !== "" ? (
                    <>
                      <img src={imagePreview} alt="Preview" />
                      {/* <div className="plusBox">+</div> */}
                    </>
                  ) : (
                    <img src={imagePreview} alt="Preview" />
                  ))}
              </div>
            </label>
            <input
              type="file"
              id="imageInput"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </>
        ) : (
          <div className="imageBox">
            <label htmlFor="imageInput">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" />
              ) : (
                <img src={image} alt="Preview" />
              )}
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAndEditAwardPage;
