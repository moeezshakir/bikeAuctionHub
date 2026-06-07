import React, { useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import MoveBackIcon from "../../../assets/svgs/MoveBackIcon";
import { useDispatch, useSelector } from "react-redux";
import { resetState } from "../../../api/reducerSlices/homeSlice";
import { reportIssue } from "../../../api/actions/homeActions";
require("../homeCSS/Settings-Style/reportAnIssue.css");

const ReportAnIssue = ({ goBack }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error } = useSelector((state) => state.homeSlice);

  useEffect(() => {
    if (status === "succeeded") {
      alert("Issue Submitted!");
    }
    if (status === "failed") {
      alert(error);
    }
    dispatch(resetState());
  }, [status]);

  // Define validation schema using Yup
  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    description: Yup.string().required("Description is required"),
  });

  // Handle form submission
  const handleSubmit = async (values, { resetForm }) => {
    // Here, you can perform actions like sending the issue data to a server or database
    console.log("Issue title:", values.title);
    console.log("Issue description:", values.description);
    let dataToSend = {
      user_id: user?.user_id,
      title: values.title,
      description: values.description,
    };
    let data = await dispatch(reportIssue(dataToSend));
    if (data.payload.status === true) {
      resetForm();
    }
  };

  return (
    <div className="reportAnIssue-container">
      <div className="header">
        <div className="moveBack" onClick={goBack}>
          <MoveBackIcon />
        </div>
        <span>Report an Issue</span>
      </div>
      <Formik
        initialValues={{ title: "", description: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <Field
                type="text"
                id="title"
                name="title"
                className="form-control"
              />
              <ErrorMessage
                name="title"
                component="div"
                className="error-message"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <Field
                as="textarea"
                id="description"
                name="description"
                className="form-control"
              />
              <ErrorMessage
                name="description"
                component="div"
                className="error-message"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ReportAnIssue;
