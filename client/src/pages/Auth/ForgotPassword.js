import React, { useState } from "react";
import Layout from "../../components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const validate = () => {
    const newErrors = {};
    
    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!answer.trim()) {
      newErrors.answer = "Please enter your favorite sports";
    }
    
    if (newPassword.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validate()) {
      return;
    }
    
    try {
      const res = await axios.post("/api/v1/auth/forgot-password", {
        email,
        answer,
        newPassword,
      });
      
      if (res && res.data.success) {
        toast.success(res.data.message, {
          duration: 5000,
          icon: "",
          style: {
            background: "green",
            color: "white",
          },
        });
        navigate("/login");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong", {
        style: {
          background: "#ff0000",
          color: "white",
        },
      });
    }
  };

  return (
    <Layout title="Forgot Password - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">RESET PASSWORD</h4>
          
          <div className="mb-3">
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              id="exampleInputEmail1"
              placeholder="Enter Your Email"
              required
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>
          
          <div className="mb-3">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={`form-control ${errors.answer ? "is-invalid" : ""}`}
              id="exampleInputAnswer"
              placeholder="What is Your Favorite sports"
              required
            />
            {errors.answer && <div className="invalid-feedback">{errors.answer}</div>}
          </div>
          
          <div className="mb-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              id="exampleInputPassword1"
              placeholder="Enter New Password"
              required
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <button type="submit" className="btn btn-primary">
            RESET PASSWORD
          </button>
          
          <div className="mt-3">
            <button
              type="button"
              className="btn forgot-btn"
              onClick={() => {
                navigate("/login");
              }}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ForgotPassword;