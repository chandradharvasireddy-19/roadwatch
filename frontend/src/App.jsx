 import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import './App.css';
import './Loader.css';
import bgImage from "./assets/nightview.jpg";

// Baseline Mock Matrix Data
const INITIAL_REPORTS = [];

const SEV = {
  critical: { color:"#ef4444", label:"Critical", icon:"🚨", radius:14 },
  medium:   { color:"#f59e0b", label:"Medium",   icon:"⚡", radius:10 },
  low:      { color:"#22c55e", label:"Low",      icon:"⚠", radius:7  },
};

function Home() {

  const navigate = useNavigate();

  return (

    <div className="hero-section">

      {/* Animated Background Layers */}
      <div className="home-background"></div>

      <div className="rain-container"></div>

      {/* Hero Content */}
      <div
        style={{
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          padding: '20px'
        }}
      >

        {/* Top Badge */}
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(15,23,42,0.75)',
            color: '#60a5fa',
            padding: '8px 20px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: '700',
            marginBottom: '28px',
            border: '1px solid rgba(37,99,235,0.5)',
            boxShadow: '0 0 25px rgba(37,99,235,0.25)'
          }}
        >
          Civic Infrastructure Monitoring System
        </div>

        {/* Main Heading */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: '800',
            lineHeight: '1.08',
            marginBottom: '26px',
            background:
              'linear-gradient(to right,#ffffff,#93c5fd,#3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(59,130,246,0.25)'
          }}
        >
          Automated Road Anomaly Detection
          <br />
          & Spatial Intelligence
        </h1>

        {/* Description */}
        <p
          style={{
            color: '#cbd5e1',
            fontSize: '20px',
            maxWidth: '780px',
            margin: '0 auto 48px auto',
            lineHeight: '1.7'
          }}
        >
          Identify localized pavement degradation,
          manage structural risks, and coordinate civic
          repairs with computer vision telemetry tracking.
        </p>

        {/* Main CTA */}
        <button
          onClick={() => navigate('/upload')}
          className="launch-btn"
        >
          Launch System Workspace 🚀
        </button>

        {/* Navigation Buttons */}
        <div className="home-nav-buttons">

          <button
            className="dark-neon-btn"
            onClick={() => navigate('/upload')}
          >
            📸 Upload
          </button>

          <button
            className="dark-neon-btn"
            onClick={() => navigate('/map')}
          >
            🗺️ Map
          </button>

          <button
            className="dark-neon-btn"
            onClick={() => navigate('/dashboard')}
          >
            📊 Dashboard
          </button>

        </div>

      </div>

    </div>
  );
}

// 📸 AI INTERACTIVE UPLOAD SECTION (USING THE NEW GLOBAL CONFIG)
function UploadPage({ onAddReport, currentCity, currentCoords }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedModel, setSelectedModel] = useState('pothole');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setAnalysisResult(null);
    }
  };

  const handleRunDiagnosis = () => {
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      setIsAnalyzing(false);
      const isPothole = selectedModel === 'pothole';
      const mockResult = {
        confidence: (Math.random() * 10 + 89).toFixed(1),
        count: Math.floor(Math.random() * 2) + 1,
        severity: isPothole ? "critical" : "medium",
        title: isPothole ? "Severe Pothole Cluster Detected" : "Structural Fatigue Cracking Detected"
      };
      
      setAnalysisResult(mockResult);
      
      onAddReport({
        id: Date.now(),
        lat: currentCoords.lat + (Math.random() * 0.04 - 0.02),
        lng: currentCoords.lng + (Math.random() * 0.04 - 0.02),
        severity: mockResult.severity,
        description: `${mockResult.title} discovered via upload sector in ${currentCity}`,
        timestamp: "Just Now",
        pothole_count: mockResult.count
      });
    }, 2000);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Report a Road Anomaly</h1>
        <p style={{ color: '#94a3b8', fontSize: 16 }}>Active Target Sector: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{currentCity}</span></p>
      </div>

      <div style={{ border: '2px dashed #334155', borderRadius: 16, padding: '40px 20px', textAlign: 'center', background: '#0f172a', marginBottom: 24, position: 'relative' }}>
        {previewUrl ? (
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
            <img src={previewUrl} alt="Preview" style={{ maxHeight: '280px', borderRadius: 8 }} />
            {analysisResult && (
              <div style={{ position: 'absolute', top: '35%', left: '40%', width: '120px', height: '90px', border: `3px solid ${analysisResult.severity === 'critical' ? '#ef4444' : '#f59e0b'}`, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                <span style={{ position: 'absolute', top: '-22px', left: '-3px', background: analysisResult.severity === 'critical' ? '#ef4444' : '#f59e0b', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px 3px 0 0' }}>
                  {selectedModel.toUpperCase()} {analysisResult.confidence}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <p style={{ fontWeight: 600, color: '#94a3b8' }}>Select raw footage or image asset</p>
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <label style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600, background: '#1e293b', padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', display: 'inline-block' }}>
            Browse Files
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div style={{ background: '#0f172a', borderRadius: 16, padding: 24, border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSelectedModel('pothole')} style={{ flex: 1, padding: 12, background: selectedModel === 'pothole' ? '#1e3a5f' : '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>🔍 Pothole Detection</button>
          <button onClick={() => setSelectedModel('crack')} style={{ flex: 1, padding: 12, background: selectedModel === 'crack' ? '#1e3a5f' : '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>🛣️ Crack Assessment</button>
        </div>
        <button onClick={handleRunDiagnosis} disabled={!file || isAnalyzing} style={{ width: '100%', padding: '14px', background: file ? '#3b82f6' : '#1e293b', border: 'none', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          {isAnalyzing ? "Processing Object Detection Frame..." : "Run AI Diagnosis"}
        </button>
      </div>
    </div>
  );
}

function MapPage({
  globalReports,
  onAddReport,
  onSetReports,
  onReset,
  setCurrentCity,
  setCurrentCoords
}) {

  const [filter, setFilter] = useState("all");
  const [heatmap, setHeatmap] = useState(false);
  const [isDronePatrolling, setIsDronePatrolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const droneIntervalRef = useRef(null);
  const mapRef = useRef(null);

  function MapController() {
    const map = useMap();

    useEffect(() => {
      mapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);

    }, [map]);

    return null;
  }

  // 🌍 GLOBAL SEARCH + AUTO SMART REPORTS
  const handleGlobalSearch = async (e) => {

    e.preventDefault();

    if (!searchQuery.trim() || !mapRef.current) return;

    setIsSearching(true);

    try {

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&accept-language=en&q=${encodeURIComponent(searchQuery)}&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {

        const { lat, lon, display_name } = data[0];

        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        const cleanName = display_name.split(",")[0];

        setCurrentCity(cleanName);

        setCurrentCoords({
          lat: newLat,
          lng: newLng
        });

        mapRef.current.setView([newLat, newLng], 12);

        const generatedReports = [];

        for (let i = 0; i < 5; i++) {

          const randomLat =
            newLat + (Math.random() * 0.08 - 0.04);

          const randomLng =
            newLng + (Math.random() * 0.08 - 0.04);

          const locationResponse = await fetch(
  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=${randomLat}&lon=${randomLng}`
);

          const locationData =
            await locationResponse.json();

          const areaName =
  locationData.address?.city ||
  locationData.address?.town ||
  locationData.address?.village ||
  locationData.address?.county ||
  locationData.address?.suburb ||
  locationData.address?.neighbourhood ||
  locationData.address?.road ||
  locationData.address?.state_district ||
  cleanName;

          const issues = [
            {
              type: "Severe pothole cluster",
              severity: "critical"
            },
            {
              type: "Surface cracking",
              severity: "medium"
            },
            {
              type: "Road edge erosion",
              severity: "critical"
            },
            {
              type: "Uneven pavement",
              severity: "low"
            },
            {
              type: "Drainage collapse",
              severity: "critical"
            },
            {
              type: "Waterlogged roadway",
              severity: "medium"
            }
          ];

          const selectedIssue =
            issues[Math.floor(Math.random() * issues.length)];

          generatedReports.push({
            id: Date.now() + i,

            lat: randomLat,
            lng: randomLng,

            severity: selectedIssue.severity,

            description:
              `${selectedIssue.type} near ${areaName}`,

            timestamp: "Just Now",

            pothole_count:
              Math.floor(Math.random() * 3) + 1
          });
        }

        // 🔥 REPLACE OLD CITY REPORTS
        onSetReports(generatedReports);

      } else {

        alert("Location not found.");

      }

    } catch (error) {

      console.error(error);

    } finally {

      setIsSearching(false);

    }
  };

  // 🛰️ DRONE STREAM
  useEffect(() => {

    if (isDronePatrolling) {

      droneIntervalRef.current = setInterval(() => {

        if (mapRef.current) {

          const center = mapRef.current.getCenter();

          onAddReport({
            id: Date.now(),

            lat:
              center.lat +
              (Math.random() * 0.04 - 0.02),

            lng:
              center.lng +
              (Math.random() * 0.04 - 0.02),

            severity: "critical",

            description:
              "Drone telemetry detected roadway damage.",

            timestamp: "Just Now",

            pothole_count:
              Math.floor(Math.random() * 2) + 1
          });
        }

      }, 4000);

    } else {

      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
      }
    }

    return () => {

      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
      }
    };

  }, [isDronePatrolling, onAddReport]);

  const activeReports = globalReports || [];

  const filtered =
    activeReports.filter(
      r => filter === "all" || r.severity === filter
    );

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 70px)",
        background: "#0f172a"
      }}
    >

      {/* TOP BAR */}
      <div
        style={{
          background: "#0f172a",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid #1e293b",
          flexWrap: "wrap"
        }}
      >

        <form
          onSubmit={handleGlobalSearch}
          style={{
            display: "flex",
            gap: 6,
            marginRight: "12px"
          }}
        >

          <input
            type="text"
            placeholder="Search any place in the world..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }

            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#fff",
              fontSize: "14px",
              width: "240px",
              outline: "none"
            }}
          />

          <button
            type="submit"
            disabled={isSearching}

            style={{
              padding: "8px 16px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >

            {isSearching ? "..." : "Go 🌐"}

          </button>
        </form>

        <button
          onClick={() => setFilter("all")}

          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "none",
            background:
              filter === "all"
                ? "#3b82f6"
                : "#1e293b",

            color: "#fff",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >

          All ({activeReports.length})

        </button>

        <button
          onClick={() => setFilter("critical")}

          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "none",
            background:
              filter === "critical"
                ? "#ef4444"
                : "#1e293b",

            color: "#fff",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >

          🚨 Critical

        </button>

        <button
          onClick={() =>
            setIsDronePatrolling(!isDronePatrolling)
          }

          style={{
            padding: "7px 16px",
            borderRadius: 10,
            border: "1px solid #3b82f6",
            background:
              isDronePatrolling
                ? "#1e3a5f"
                : "transparent",

            color: "#60a5fa",
            fontWeight: 700,
            cursor: "pointer",
            marginLeft: "auto"
          }}
        >

          {isDronePatrolling
            ? "🛰️ Drone Active"
            : "🛰️ Simulate Drone Stream"}

        </button>

        <button
          onClick={onReset}

          style={{
            padding: "7px 14px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "transparent",
            color: "#64748b",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >

          Reset Matrix 🧹

        </button>

        <button
          onClick={() => setHeatmap(!heatmap)}

          style={{
            padding: "7px 16px",
            borderRadius: 10,
            border: "none",
            background:
              heatmap
                ? "#7c3aed"
                : "#1e293b",

            color: "#fff",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >

          🔥 Heatmap

        </button>
      </div>

      {/* MAP */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden"
        }}
      >

        <div
          style={{
            flex: 1,
            position: "relative",
            height: "100%"
          }}
        >

          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}

            style={{
              width: "100%",
              height: "100%"
            }}
          >

            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CARTO"
            />

            <MapController />

            {filtered.map((report) => {

              const s =
                SEV[report.severity] || SEV.low;

              return (

                <CircleMarker
                  key={report.id}

                  center={[
                    report.lat,
                    report.lng
                  ]}

                  radius={
                    heatmap
                      ? s.radius * 2
                      : s.radius
                  }

                  pathOptions={{
                    color: s.color,
                    fillColor: s.color,
                    fillOpacity:
                      heatmap ? 0.3 : 0.8
                  }}
                >

                  <Popup>
                    <span style={{ color: "#000" }}>
                      {report.description}
                    </span>
                  </Popup>

                </CircleMarker>
              );
            })}

          </MapContainer>

        </div>
      </div>
    </div>
  );
}

// 📊 OPERATIONAL REPAIR DASHBOARD
function Dashboard({ reports, currentCity }) {
  const navigate = useNavigate();
  const criticalCount = reports.filter(r => r.severity === "critical").length;
  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Analytics Dashboard</h1>
        <p style={{ color: '#94a3b8', fontSize: 16 }}>Municipal logs overview. Target Tracking Focus: {currentCity}</p>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', background: '#0f172a', padding: 24, borderRadius: 16, border: '1px solid #1e293b' }}>
          <p style={{ color: '#94a3b8', margin: '0 0 12px 0' }}>Total Anomalies Tracked</p>
          <h2 style={{ fontSize: 36, color: '#3b82f6', margin: 0 }}>{reports.length}</h2>
        </div>
        <div style={{ flex: '1 1 280px', background: '#0f172a', padding: 24, borderRadius: 16, border: '1px solid #1e293b' }}>
          <p style={{ color: '#94a3b8', margin: '0 0 12px 0' }}>Urgent Dispatches Required</p>
          <h2 style={{ fontSize: 36, color: '#ef4444', margin: 0 }}>{criticalCount}</h2>
        </div>
      </div>

      <div style={{ background: '#0f172a', borderRadius: 16, padding: 24, border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b' }}>
              <th style={{ padding: 12 }}>System ID</th>
              <th style={{ padding: 12 }}>Signature Detection Log Info</th>
              <th style={{ padding: 12 }}>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(issue => (
              <tr key={issue.id} onClick={() => navigate('/map')} style={{ borderBottom: '1px solid #1e293b', cursor: 'pointer' }}>
                <td style={{ padding: 16, color: '#60a5fa' }}>RWD-{issue.id.toString().slice(-4)}</td>
                <td style={{ padding: 16 }}>{issue.description}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, background: issue.severity === 'critical' ? '#451a1a' : '#1b3425', color: issue.severity === 'critical' ? '#f87171' : '#4ade80' }}>
                    {issue.severity.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: '#0f172a', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #1e293b' }}>
      <div onClick={() => navigate('/')} style={{ fontWeight: 800, fontSize: 20, color: '#fff', cursor: 'pointer' }}>
        Road<span style={{ color: '#3b82f6' }}>Watch</span>
      </div>
      
    </nav>
  );
}

export default function App() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [currentCity, setCurrentCity] = useState("Global Monitoring");
  const [currentCoords, setCurrentCoords] = useState({ lat: 0, lng: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
  }, 3500);

  return () => clearTimeout(timer);
}, []);
  const handleAddReport = (newReport) => { setReports(prev => [newReport, ...prev]); };
  const handleSetReports = (newReports) => {
  setReports(newReports);
};
  const handleResetReports = () => { 
    setReports(INITIAL_REPORTS); 
    setCurrentCity("Global Monitoring");
    setCurrentCoords({ lat: 0, lng: 0 });
  };
  if (loading) {
  return (
    <div className="loader-screen">

      <div className="road-crack"></div>

      <h1 className="loader-title">
        ROADWATCH AI
      </h1>

      <p className="loader-subtitle">
        Initializing Spatial Intelligence...
      </p>

      <div className="loader-bar">
        <div className="loader-progress"></div>
      </div>

    </div>
  );
}
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="upload"   element={<UploadPage onAddReport={handleAddReport} currentCity={currentCity} currentCoords={currentCoords} />} />
        <Route path="map"      element={<MapPage onSetReports={handleSetReports} globalReports={reports} onAddReport={handleAddReport} onReset={handleResetReports} setCurrentCity={setCurrentCity} setCurrentCoords={setCurrentCoords} />} />
        <Route path="dashboard" element={<Dashboard reports={reports} currentCity={currentCity} />} />
      </Routes>
    </Router> 
  );
}