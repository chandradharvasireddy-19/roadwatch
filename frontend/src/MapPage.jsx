 import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SEV = {
  critical: { color:"#ef4444", bg:"#fee2e2", border:"#fca5a5", label:"Critical", icon:"🚨", radius:14 },
  medium:   { color:"#f59e0b", bg:"#fef3c7", border:"#fcd34d", label:"Medium",   icon:"⚡", radius:10 },
  low:      { color:"#22c55e", bg:"#dcfce7", border:"#86efac", label:"Low",      icon:"⚠", radius:7  },
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

export default function MapPage({ globalReports, onAddReport, onReset }) {
  const [filter, setFilter]         = useState("all");
  const [heatmap, setHeatmap]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");
  const [isDronePatrolling, setIsDronePatrolling] = useState(false);
  
  const droneIntervalRef = useRef(null);
  const activeReports = globalReports || [];

  // 🛰️ Autonomous Drone Patrolling Engine simulation stream
  useEffect(() => {
    if (isDronePatrolling) {
      droneIntervalRef.current = setInterval(() => {
        const locations = [
          { lat: 17.4485, lng: 78.3741, desc: "Drone Asset: Severe asphalt structural rupture on Gachibowli main arterial pass" },
          { lat: 17.3912, lng: 78.4690, desc: "Drone Asset: Depressed alignment subgrade fault near Nampally station track" },
          { lat: 17.4852, lng: 78.5420, desc: "Drone Asset: Deep core water cavity cluster opening on Sainikpuri roadway" }
        ];
        
        // Pick a random drone target from the spatial directory matrix
        const randomTarget = locations[Math.floor(Math.random() * locations.length)];
        
        onAddReport({
          id: Date.now(),
          lat: randomTarget.lat + (Math.random() * 0.004 - 0.002), // subtle grid offset variance
          lng: randomTarget.lng + (Math.random() * 0.004 - 0.002),
          severity: "critical",
          description: `${randomTarget.desc} (${(Math.random() * 5 + 94).toFixed(1)}% AI Confidence Matrix)`,
          timestamp: "Just Now",
          pothole_count: Math.floor(Math.random() * 3) + 2
        });
      }, 4000); // Push an incoming edge stream report every 4 seconds!
    } else {
      if (droneIntervalRef.current) clearInterval(droneIntervalRef.current);
    }

    return () => {
      if (droneIntervalRef.current) clearInterval(droneIntervalRef.current);
    };
  }, [isDronePatrolling, onAddReport]);

  const filtered = activeReports.filter(r => {
    const matchFilter = filter === "all" || r.severity === filter;
    const matchSearch = r.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    total:    activeReports.length,
    critical: activeReports.filter(r => r.severity === "critical").length,
    medium:   activeReports.filter(r => r.severity === "medium").length,
    low:      activeReports.filter(r => r.severity === "low").length,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 70px)", background:"#0f172a", fontFamily: "system-ui" }}>
      
      {/* Top Controls Bar */}
      <div style={{ background:"#0f172a", padding:"12px 20px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", borderBottom:"1px solid #1e293b" }}>
        {[
          { label:"All Reports",     val:counts.total,    col:"#60a5fa", key:"all" },
          { label:"🚨 Critical",     val:counts.critical, col:"#ef4444", key:"critical" },
          { label:"⚡ Medium",       val:counts.medium,   col:"#f59e0b", key:"medium" },
          { label:"⚠ Low",          val:counts.low,      col:"#22c55e", key:"low" },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{
            padding:"6px 14px", borderRadius:999, border:"none", cursor:"pointer",
            fontWeight:700, fontSize:13, background: filter===s.key ? s.col : "#1e293b",
            color: filter===s.key ? "#fff" : "#94a3b8"
          }}>
            {s.label} ({s.val})
          </button>
        ))}

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search reports…"
          style={{ marginLeft:"auto", padding:"7px 14px", borderRadius:10, border:"1px solid #334155", background:"#1e293b", color:"#e2e8f0", fontSize:13, outline:"none", minWidth:180 }} />

        {/* 🛰️ TELEMETRY SIMULATION CONTROLS */}
        <button onClick={() => setIsDronePatrolling(!isDronePatrolling)} style={{
          padding:"7px 16px", borderRadius:10, border:"1px solid #3b82f6", cursor:"pointer", fontWeight:700, fontSize:13,
          background: isDronePatrolling ? "#1e3a5f" : "transparent", color: isDronePatrolling ? "#60a5fa" : "#3b82f6",
          animation: isDronePatrolling ? "pulse 2s infinite" : "none"
        }}>
          {isDronePatrolling ? "🛰️ Drone Autonomous Patrol Active" : "🛰️ Simulate Drone Patrol"}
        </button>

        <button onClick={onReset} style={{
          padding:"7px 14px", borderRadius:10, border:"1px solid #334155", cursor:"pointer", fontWeight:600, fontSize:13,
          background: "transparent", color: "#64748b"
        }}>
          Reset Matrix 🧹
        </button>

        <button onClick={() => setHeatmap(h => !h)} style={{
          padding:"7px 16px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:13,
          background: heatmap ? "#7c3aed" : "#1e293b", color: heatmap ? "#fff" : "#94a3b8"
        }}>
          🔥 {heatmap ? "Heatmap ON" : "Heatmap OFF"}
        </button>
      </div>

      {/* Main Container Split View */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        
        {/* Map View Box */}
        <div style={{ flex:1, position:"relative", height:"100%" }}>
          <MapContainer
            center={[17.4399, 78.4983]}
            zoom={12}
            style={{ width:"100%", height:"100%" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            
            <MapResizer />

            {filtered.map(report => {
              const s = SEV[report.severity];
              const isSelected = selected?.id === report.id;
              const baseRadius = heatmap ? s.radius * (report.pothole_count * 1.4) : s.radius;
              return (
                <CircleMarker
                  key={report.id}
                  center={[report.lat, report.lng]}
                  radius={isSelected ? baseRadius + 4 : baseRadius}
                  pathOptions={{
                    color: s.color,
                    fillColor: s.color,
                    fillOpacity: heatmap ? 0.35 : (isSelected ? 0.95 : 0.8),
                    weight: isSelected ? 3 : 2,
                  }}
                  eventHandlers={{ click: () => setSelected(report) }}
                >
                  <Popup>
                    <div style={{ minWidth:200, padding:4, color: "#000" }}>
                      <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:600 }}>{report.description}</p>
                      <p style={{ margin:0, fontSize:12, color:"#64748b" }}>{report.timestamp}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Sidebar View Box */}
        <div style={{ width:320, background:"#0f172a", borderLeft:"1px solid #1e293b", overflowY:"auto" }}>
          <div style={{ padding:16, borderBottom:"1px solid #1e293b" }}>
            <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#e2e8f0" }}>{filtered.length} reports shown</p>
          </div>
          <div>
            {filtered.map(report => {
              const s = SEV[report.severity];
              const isSelected = selected?.id === report.id;
              return (
                <div key={report.id} onClick={() => setSelected(report)}
                  style={{ padding:16, cursor:"pointer", borderBottom:"1px solid #1e293b",
                    background: isSelected ? "#1e293b" : "transparent",
                    borderLeft: isSelected ? `3px solid ${s.color}` : "3px solid transparent" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ color:s.color, fontSize:11, fontWeight:700 }}>{s.icon} {s.label}</span>
                    <span style={{ fontSize:11, color:"#475569" }}>{report.timestamp}</span>
                  </div>
                  <p style={{ margin:0, fontSize:13, color:"#cbd5e1" }}>{report.description}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}