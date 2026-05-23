 import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '80px 24px', maxWidth: '1000px', margin: '0 auto', color: '#fff', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', background: '#1e3a5f', color: '#60a5fa', padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', marginBottom: '24px', border: '1px solid #2563eb' }}>
        🛰️ CoERS IIT-M Hackathon Submission Workspace
      </div>
      <h1 style={{ fontSize: '52px', fontWeight: '800', lineHeight: '1.15', marginBottom: '20px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Automated Road Anomaly Detection <br /> & Spatial Intelligence
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '19px', maxWidth: '640px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
        Identify localized pavement degradation, manage structural risks, and coordinate civic repairs with computer vision telemetry tracking.
      </p>
      <button onClick={() => navigate('/upload')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '16px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}>
        Launch System Workspace 🚀
      </button>
    </div>
  );
}