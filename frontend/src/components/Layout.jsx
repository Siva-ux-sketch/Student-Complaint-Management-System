import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { initials } from "../utils.js";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">CD</span>
          CampusDesk
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          {user.role === "student" && <NavLink to="/file">File complaint</NavLink>}
          <NavLink to="/activity">Activity</NavLink>
          <NavLink to="/guidelines">Workflow</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <span className="user-chip">
            <span className="user-chip-text">
              <strong>{user.name}</strong>
              <span className="muted">
                {user.role}
                {user.area ? ` · ${user.area}` : ""}
              </span>
            </span>
            <span className="avatar" aria-hidden>
              {initials(user.name)}
            </span>
          </span>
          <button className="btn btn-ghost" type="button" onClick={logout}>
            Log out
          </button>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
