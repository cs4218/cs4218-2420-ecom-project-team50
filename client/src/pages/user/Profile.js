import React, { useState, useEffect } from "react";
import UserMenu from "../../components/UserMenu";
import Layout from "./../../components/Layout";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import axios from "axios";

const Profile = () => {
  const [auth, setAuth] = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    const { email, name, phone, address } = auth?.user || {};
    setName(name || "");
    setPhone(phone || "");
    setEmail(email || "");
    setAddress(address || "");
  }, [auth?.user]);

  const hasChanges = () => {
    const { name: origName, phone: origPhone, address: origAddress } = auth?.user || {};
    return (
      name !== origName ||
      phone !== origPhone ||
      address !== origAddress ||
      password !== ""
    );
  };

  const hasEmptyFields = () => {
    return !name || !phone || !address;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    
    setPhoneError("");
    
    if (value === "" || /^\d+$/.test(value)) {
      if (value.length <= 15) {
        setPhone(value);
      } else {
        setPhoneError("Phone number cannot exceed 15 digits");
      }
    } else {
      setPhoneError("Phone number can only contain digits");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (hasEmptyFields()) {
      toast.error("Required fields cannot be empty");
      const { name: origName, phone: origPhone, address: origAddress } = auth?.user || {};
      if (!name) setName(origName || "");
      if (!phone) setPhone(origPhone || "");
      if (!address) setAddress(origAddress || "");
      return;
    }
    
    if (!hasChanges()) {
      toast.error("Nothing to update");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.put("/api/v1/auth/profile", {
        name,
        email,
        password,
        phone,
        address,
      });
      
      if (data?.error) {
        toast.error(data?.error);
      } else {
        setAuth({ ...auth, user: data?.updatedUser });
        try {
          let ls = localStorage.getItem("auth");
          ls = JSON.parse(ls);
          ls.user = data.updatedUser;
          localStorage.setItem("auth", JSON.stringify(ls));
          toast.success("Profile Updated Successfully");
          setPassword("");
        } catch (lsError) {
          console.log(lsError);
          toast.error("Failed to update local storage");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={"Your Profile"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <div className="form-container">
              <form onSubmit={handleSubmit}>
                <h4 className="title">USER PROFILE</h4>
                <div className="mb-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    id="exampleInputName"
                    placeholder="Enter Your Name"
                    autoFocus
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail"
                    placeholder="Enter Your Email"
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    id="exampleInputPassword"
                    placeholder="Enter New Password"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`form-control ${phoneError ? "is-invalid" : ""}`}
                    id="exampleInputPhone"
                    placeholder="Enter Your Phone"
                    required
                  />
                  {phoneError && (
                    <div className="invalid-feedback">
                      {phoneError}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-control"
                    id="exampleInputAddress"
                    placeholder="Enter Your Address"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "UPDATING..." : "UPDATE"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;