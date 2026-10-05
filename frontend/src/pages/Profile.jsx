import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDateTime, initials } from "../utils.js";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="page">
      <p className="eyebrow">Account</p>
      <h1>Your profile</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Account details used across CampusDesk for filing and assignment.
      </p>

      <div className="profile-grid">
        <div className="card profile-side">
          <div className="profile-avatar">{initials(user.name)}</div>
          <h2>{user.name}</h2>
          <span className="role-pill">{user.role}</span>
        </div>

        <div className="card">
          <h3>Details</h3>
          <dl className="meta-list">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd style={{ textTransform: "capitalize" }}>{user.role}</dd>
            </div>
            {user.studentId && (
              <div>
                <dt>Student ID</dt>
                <dd>{user.studentId}</dd>
              </div>
            )}
            {user.department && (
              <div>
                <dt>Department</dt>
                <dd>{user.department}</dd>
              </div>
            )}
            {user.area && (
              <div>
                <dt>Campus area</dt>
                <dd>{user.area}</dd>
              </div>
            )}
            {user.createdAt && (
              <div>
                <dt>Member since</dt>
                <dd>{formatDateTime(user.createdAt)}</dd>
              </div>
            )}
          </dl>

          <div className="btn-row" style={{ marginTop: 20 }}>
            <Link className="btn btn-primary" to="/">
              Go to dashboard
            </Link>
            {user.role === "student" && (
              <Link className="btn btn-ghost" to="/file">
                File a complaint
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
