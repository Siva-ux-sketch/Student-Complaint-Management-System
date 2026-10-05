import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import RaiseComplaintForm from "../components/RaiseComplaintForm.jsx";

export default function FileComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user.role !== "student") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page file-page">
      <section className="hero-panel">
        <p className="eyebrow">New complaint</p>
        <h1>File a campus complaint</h1>
        <p className="muted">
          Choose the campus area (library, canteen, ground, etc.). Admin will review first, then
          route it to the right staff.
        </p>
      </section>
      <div className="card raise-card file-form-card">
        <RaiseComplaintForm
          compact
          onCreated={(complaint) => navigate(`/complaints/${complaint._id}`)}
        />
      </div>
    </div>
  );
}
