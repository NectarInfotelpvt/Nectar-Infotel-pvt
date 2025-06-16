import React, { useState, useEffect } from "react";
import {
  FaDownload,
  FaMapMarkedAlt,
  FaClipboardList,
  FaSignOutAlt, // Import FaSignOutAlt for the logout icon
} from "react-icons/fa";
import { motion } from "framer-motion";
import AdminSubmissionsTable from "../components/AdminSubmissionTable";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const AdminPanel = () => {
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [date, setDate] = useState("");
  const [erpIdDownload, setErpIdDownload] = useState("");
  const [bgColor, setBgColor] = useState("#e3f2fd");

  const [districtList, setDistrictList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [dateList, setDateList] = useState([]);

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    setBgColor("#e3f2fd");

    // Fetch unique districts
    fetch("http://localhost:5001/api/admin/unique-districts")
      .then((res) => res.json())
      .then(setDistrictList)
      .catch((err) => console.error("❌ Failed to fetch districts:", err));

    // Fetch unique states
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/unique-states`)
      .then((res) => res.json())
      .then(setStateList)
      .catch((err) => console.error("❌ Failed to fetch states:", err));

    // Fetch unique dates
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/unique-dates`)
      .then((res) => res.json())
      .then(setDateList)
      .catch((err) => console.error("❌ Failed to fetch dates:", err));
  }, []);

  const handleDownload = () => {
    if (!district || !state || !date) {
      console.log("Please fill all fields to download filtered dataset.");
      return;
    }
    const query = new URLSearchParams({ district, state, date }).toString();
    window.open(`${import.meta.env.VITE_API_URL}/api/admin/download-submissions?${query}`, "_blank");
  };

  const handleDownloadAll = () => {
     window.open(`${import.meta.env.VITE_API_URL}/api/admin/download-submissions`, "_blank");
  };

  const handleDownloadByErpId = () => {
    if (!erpIdDownload.trim()) {
      console.log("Please enter ERP ID.");
      return;
    }

    const link = document.createElement("a");
   link.href = `${import.meta.env.VITE_API_URL}/api/admin/download-submissions/${erpIdDownload}`;
    link.download = `${erpIdDownload}_submissions.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New handleLogout function
  const handleLogout = () => {
    // Clear the admin token from localStorage.
    // Make sure 'adminToken' matches the key you use when an admin logs in.
    localStorage.removeItem("adminToken");
    // If you use session storage for admin, clear it too:
    // sessionStorage.removeItem("adminSession");

    // Redirect to the dashboard/login page (assuming '/' is your login route)
    navigate("/");
  };

  return (
    <div
      style={{
        backgroundColor: bgColor,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        className="py-4 text-white d-flex justify-content-between align-items-center px-4" // Added d-flex for alignment
        style={{ backgroundColor: "#0d6efd" }}
      >
        <h2>
          <FaMapMarkedAlt className="me-2" /> Admin Panel
        </h2>
        {/* Logout Button */}
        <button className="btn btn-outline-light" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> Logout
        </button>
      </header>

      <motion.div
        className="w-100 text-center text-dark py-4 greeting-card-full shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      />

      <main className="container my-4 flex-grow-1">
        <div className="row g-4">
          {/* Download Dataset Section - Content split into two columns */}
          <motion.div
            className="col-md-12 d-flex"
            whileHover={{ scale: 1.02 }}
          >
            {" "}
            {/* This now spans full width */}
            <div
              className="card shadow-sm panel-card w-100 d-flex flex-column"
              style={{ backgroundColor: "#e7f0ff" }}
            >
              <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white fw-bold">
                <span>
                  <FaDownload className="me-2" /> Download Dataset
                </span>
              </div>
              <div className="card-body d-flex flex-column flex-grow-1">
                <div className="row">
                  <div className="col-md-6 d-flex flex-column">
                    {" "}
                    {/* Left half of the card body */}
                    <h5 className="mb-3 text-secondary">Filter and Download</h5>
                    <select
                      className="form-select mb-2"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    >
                      <option value="">Select District</option>
                      {districtList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <select
                      className="form-select mb-2"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option value="">Select State</option>
                      {stateList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <select
                      className="form-select mb-3"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    >
                      <option value="">Select Date</option>
                      {dateList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn btn-primary w-100"
                      onClick={handleDownload}
                    >
                      Download Filtered Dataset
                    </button>
                  </div>

                  <div className="col-md-6 d-flex flex-column">
                    {" "}
                    {/* Right half of the card body */}
                    <h5 className="mb-3 text-secondary">Specific Downloads</h5>
                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Enter ERP ID to download"
                      value={erpIdDownload}
                      onChange={(e) => setErpIdDownload(e.target.value)}
                    />
                    <button
                      className="btn btn-success w-100 mb-4"
                      onClick={handleDownloadByErpId}
                    >
                      Download My ERP Dataset
                    </button>

                    <button
                      className="btn btn-outline-primary w-100 py-3 fs-5 mt-auto"
                      onClick={handleDownloadAll}
                    >
                      Download Entire Dataset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* All ERP Submissions Table */}
          <motion.div className="col-12" whileHover={{ scale: 1.01 }}>
            <div
              className="card mt-4 mb-5 shadow-sm panel-card"
              style={{ backgroundColor: "#e7f0ff" }}
            >
              <div className="card-header bg-primary text-white fw-bold">
                <FaClipboardList className="me-2" /> All ERP Submissions
              </div>
              <div className="card-body">
                <AdminSubmissionsTable />
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer
        className="text-white text-center py-3"
        style={{ backgroundColor: "#0d6efd" }}
      >
        <small>
          &copy; {new Date().getFullYear()} Nectar Infotel. All rights reserved.
        </small>
      </footer>

      <style>{`
        .panel-card {
          border-radius: 1rem;
          transition: transform 0.3s ease;
        }
        .greeting-card-full {
          background: #d0e7ff;
          border-bottom-left-radius: 20%;
          border-bottom-right-radius: 20%;
          border: 2px solid #2196f3;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;