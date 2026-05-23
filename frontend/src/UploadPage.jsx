 import { useState } from 'react';

export default function UploadPage({ onAddReport }) {
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

    // Simulated Engine latency block. Person 2 (Backend) will switch this to an Axios POST to YOLOv8 endpoint!
    setTimeout(() => {
      setIsAnalyzing(false);
      const isPothole = selectedModel === 'pothole';
      
      const resultPayload = {
        confidence: (Math.random() * 10 + 89).toFixed(1),
        count: Math.floor(Math.random() * 2) + 1,
        severity: isPothole ? "critical" : "medium",
        title: isPothole ? "Severe Pothole Cluster Detected" : "Structural Fatigue Cracking Detected"
      };
      
      setAnalysisResult(resultPayload);

      onAddReport({
        id: Date.now(),
        lat: 17.38 + Math.random() * 0.1,
        lng: 78.45 + Math.random() * 0.1,
        severity: resultPayload.severity,
        description: `${resultPayload.title} (${resultPayload.confidence}% Confidence Index)`,
        timestamp: "Just Now",
        pothole_count: resultPayload.count
      });
    }, 2000);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Report a Road Issue</h1>
        <p style={{ color: '#94a3b8', fontSize: 16 }}>Upload raw environmental images for processing.</p>
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
            <p style={{ fontWeight: 600, color: '#94a3b8' }}>Select raw asset for model inference</p>
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
        {analysisResult && (
          <div style={{ marginTop: 24, padding: 16, background: '#1e293b', borderRadius: 12, borderLeft: `4px solid ${analysisResult.severity === 'critical' ? '#ef4444' : '#f59e0b'}` }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#fff' }}>{analysisResult.title}</h4>
            <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Confidence Factor: {analysisResult.confidence}% | Anomaly Count: {analysisResult.count}</p>
          </div>
        )}
      </div>
    </div>
  );
}