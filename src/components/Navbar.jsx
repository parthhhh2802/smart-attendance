import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  FiHome,
  FiCalendar,
  FiFileText,
  FiUser,
  FiLogOut,
  FiPlus,
} from "react-icons/fi";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <nav className="navbar  navbar-expand-lg custom-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">
          SmartAttend
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/dashboard")}`}
                to="/dashboard"
              >
                <FiHome className="me-1" /> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/sessions")}`}
                to="/sessions"
              >
                <FiCalendar className="me-1" /> Sessions
              </Link>
            </li>
            {(user?.role === "admin" || user?.role === "faculty") && (
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive("/sessions/create")}`}
                  to="/sessions/create"
                >
                  <FiPlus className="me-1" /> Create Session
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/reports")}`}
                to="/reports"
              >
                <FiFileText className="me-1" /> Reports
              </Link>
            </li>
          </ul>

          <div className="dropdown d-flex">
                   
              <FiUser className="m-2" />
            <a
              className="btn btn-primary dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded='true'
            > {user?.name || "User"}</a>
            
              <ul className="dropdown-menu">
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={() => navigate('/profile')}
                  >
                    Profile
                  </button>
                </li>
                
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
