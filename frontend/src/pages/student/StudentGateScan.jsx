import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode, ArrowDownLeft, ArrowUpRight, Clock, Calendar, MapPin,
  CheckCircle2, AlertCircle, Camera, CameraOff, X, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SCANNER_DIV_ID = 'student-gate-qr-scanner';

async function safeStop(ref) {
  if (ref.current) {
    try { await ref.current.stop(); } catch (_) {}
    try { ref.current.clear(); }    catch (_) {}
    ref.current = null;
  }
}

export default function StudentGateScan() {
  const { user } = useAuth();

  const [latestLog,     setLatestLog]     = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [message,       setMessage]       = useState({ type: '', text: '' });

  /* camera state */
  const [cameraOpen,    setCameraOpen]    = useState(false);
  const [cameraErr,     setCameraErr]     = useState('');
  const [scanStatus,    setScanStatus]    = useState('idle'); // idle | scanning | success | error
  const [exitLoading,   setExitLoading]   = useState(false);

  const scannerRef = useRef(null);

  /* ── fetch latest log ── */
  const fetchLatestStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/scan/logs?limit=1');
      if (res.data.success && res.data.data.length > 0) {
        setLatestLog(res.data.data[0]);
      } else {
        setLatestLog(null);
      }
    } catch (err) {
      console.error('fetchLatestStatus:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLatestStatus(); }, []);

  /* cleanup camera on unmount */
  useEffect(() => () => { safeStop(scannerRef); }, []);

  /* ── beep ── */
  const beep = (ok) => {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(ok ? 880 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (ok ? 0.15 : 0.3));
      osc.stop(ctx.currentTime + (ok ? 0.15 : 0.3));
    } catch (_) {}
  };

  /* ════════════════════════════════
     ENTRY: open camera, scan gate QR
  ════════════════════════════════ */
  const startEntryCamera = useCallback(async () => {
    setCameraErr('');
    setScanStatus('scanning');
    setMessage({ type: '', text: '' });
    await new Promise(r => setTimeout(r, 200)); // let DOM mount

    const scanner = new Html5Qrcode(SCANNER_DIV_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decoded) => {
          /* stop camera first */
          await safeStop(scannerRef);
          setScanStatus('scanning');

          try {
            const res = await axios.post('/api/scan/student-scan', {
              qrData: decoded,
              type: 'entry'
            });

            if (res.data.success) {
              beep(true);
              setScanStatus('success');
              setMessage({
                type: 'success',
                text: 'Welcome to the Library! Your entry has been successfully logged.'
              });
              await fetchLatestStatus();

              /* auto close camera modal after showing success */
              setTimeout(() => {
                setCameraOpen(false);
                setScanStatus('idle');
              }, 2000);
            }
          } catch (err) {
            beep(false);
            setScanStatus('error');
            const msg = err.response?.data?.message || 'Invalid QR code. Please scan the official Library Gate QR poster.';
            setCameraErr(msg);
            setMessage({ type: 'error', text: msg });
          }
        },
        () => {} // ignore parse errors silently
      );
    } catch (err) {
      const msg = err?.message || 'Camera access denied. Please allow camera permissions in your browser.';
      setCameraErr(msg);
      setScanStatus('error');
      setMessage({ type: 'error', text: msg });
    }
  }, [fetchLatestStatus]);

  const openEntryCamera = () => {
    setCameraOpen(true);
    setCameraErr('');
    setScanStatus('idle');
    startEntryCamera();
  };

  const closeCamera = () => {
    safeStop(scannerRef);
    setCameraOpen(false);
    setScanStatus('idle');
    setCameraErr('');
  };

  /* ════════════════════════════════
     EXIT: one-click, no scan needed
  ════════════════════════════════ */
  const handleExit = async () => {
    setExitLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.post('/api/scan/student-scan', {
        qrData: JSON.stringify({ type: 'library-gate' }),
        type: 'exit'
      });
      if (res.data.success) {
        beep(true);
        setMessage({ type: 'success', text: 'You have exited the library. Thank you for visiting!' });
        await fetchLatestStatus();
      }
    } catch (err) {
      beep(false);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Exit failed. Please try again.' });
    } finally {
      setExitLoading(false);
    }
  };

  /* ── derived state ── */
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
        <div className="animate-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QrCode size={20} color="var(--accent-cyan)"/>
        </div>
        Checking your library status…
      </div>
    );
  }

  const isInside = latestLog && latestLog.type === 'entry';

  /* ════════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>

      {/* Header card */}
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: isInside ? 'var(--success-bg)' : 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isInside ? 'var(--success)' : 'var(--accent-cyan)'}`, color: isInside ? 'var(--success)' : 'var(--accent-cyan)' }}>
          {isInside ? <Shield size={32}/> : <QrCode size={32}/>}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>Library Gate Access</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
          {isInside
            ? 'You are currently inside the library. Click Exit when you leave.'
            : 'Scan the Library Gate QR poster at the entrance to log your entry.'}
        </p>
      </div>

      {/* Message banner */}
      {message.text && (
        <div className="animate-fade-in" style={{
          padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
          <span>{message.text}</span>
        </div>
      )}

      {/* Status & Action Panel */}
      <div className="glass-panel animate-fade-in" style={{
        padding: '2.5rem',
        border: isInside ? '1px solid var(--success)' : '1px solid var(--glass-border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem'
      }}>

        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: isInside ? 'var(--success)' : 'var(--danger)', boxShadow: isInside ? '0 0 10px var(--success)' : 'none', flexShrink: 0 }}/>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Current Status: {isInside ? 'Inside Library' : 'Outside Library'}
          </span>
        </div>

        {/* Entry details when inside */}
        {isInside && latestLog && (
          <div style={{ width: '100%', background: 'var(--bg-surface-hover)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div className="flex-between">
              <span style={{ color: 'var(--text-secondary)' }}>Checked In At:</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14}/>
                {new Date(latestLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </strong>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--text-secondary)' }}>Check-In Date:</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14}/>
                {new Date(latestLog.timestamp).toLocaleDateString()}
              </strong>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--text-secondary)' }}>Time Inside:</span>
              <strong>
                {(() => {
                  const mins = Math.floor((new Date() - new Date(latestLog.timestamp)) / 60000);
                  return mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h ${mins%60}m`;
                })()}
              </strong>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={14}/>{user?.institution?.name || 'Library'}
              </strong>
            </div>
          </div>
        )}

        {/* ── Action Button ── */}
        <div style={{ width: '100%' }}>
          {isInside ? (
            /* EXIT — just a button, no scan */
            <button
              className="btn btn-danger"
              onClick={handleExit}
              disabled={exitLoading}
              style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: '0 4px 15px rgba(239,68,68,0.2)' }}
            >
              {exitLoading
                ? <><span className="animate-pulse" style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'currentColor', opacity: 0.6 }}/><span>Logging Exit…</span></>
                : <><ArrowUpRight size={20}/><span>Click to Exit Library</span></>}
            </button>
          ) : (
            /* ENTRY — open camera */
            <button
              className="btn btn-primary"
              onClick={openEntryCamera}
              style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
            >
              <Camera size={20}/><span>Scan Library QR to Enter</span>
            </button>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>Access Info</h3>
        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: '1.6' }}>
          <li>Scan the <strong>Library Gate QR poster</strong> displayed at the library entrance to check in.</li>
          <li>Click <strong>Exit</strong> when leaving — no scanning needed on exit.</li>
          <li>Your name, Student ID ({user?.studentId}), and timestamps are recorded automatically.</li>
          <li>Your attendance is visible to library staff in real-time.</li>
        </ul>
      </div>

      {/* ════════ CAMERA MODAL ════════ */}
      {cameraOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#06080f', border: '1px solid rgba(56,189,248,0.25)', color: 'white' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif', color: '#38bdf8', margin: 0 }}>Scan Gate QR to Enter</h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0.2rem 0 0 0' }}>Point at the Library Gate QR poster</p>
              </div>
              {scanStatus !== 'success' && (
                <button onClick={closeCamera} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.25rem' }}>
                  <X size={20}/>
                </button>
              )}
            </div>

            {/* Camera error */}
            {cameraErr && scanStatus === 'error' && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#f87171', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }}/><span>{cameraErr}</span>
              </div>
            )}

            {/* SUCCESS state — no camera, just success UI */}
            {scanStatus === 'success' ? (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1rem 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={40} color="#4ade80"/>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#4ade80', margin: 0 }}>Access Granted!</p>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: '0.25rem 0 0 0' }}>Entry logged successfully. Welcome, {user?.name?.split(' ')[0]}!</p>
                </div>
              </div>
            ) : (
              /* Camera live view */
              <>
                <div style={{ position: 'relative' }}>
                  {/* Scanning label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} className="animate-pulse"/>
                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600 }}>CAMERA LIVE — SCANNING</span>
                  </div>

                  {/* QR scanner div */}
                  <div id={SCANNER_DIV_ID} style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid rgba(56,189,248,0.5)', boxShadow: '0 0 24px rgba(56,189,248,0.2)', minHeight: '240px', background: '#000' }}/>

                  {/* Corner marks overlay */}
                  {['topleft','topright','bottomleft','bottomright'].map(corner => (
                    <div key={corner} style={{
                      position: 'absolute', width: '20px', height: '20px',
                      top: corner.includes('top') ? '32px' : 'auto',
                      bottom: corner.includes('bottom') ? '4px' : 'auto',
                      left: corner.includes('left') ? '4px' : 'auto',
                      right: corner.includes('right') ? '4px' : 'auto',
                      borderTop: corner.includes('top') ? '3px solid #38bdf8' : 'none',
                      borderBottom: corner.includes('bottom') ? '3px solid #38bdf8' : 'none',
                      borderLeft: corner.includes('left') ? '3px solid #38bdf8' : 'none',
                      borderRight: corner.includes('right') ? '3px solid #38bdf8' : 'none',
                      borderTopLeftRadius: corner === 'topleft' ? '4px' : 0,
                      borderTopRightRadius: corner === 'topright' ? '4px' : 0,
                      borderBottomLeftRadius: corner === 'bottomleft' ? '4px' : 0,
                      borderBottomRightRadius: corner === 'bottomright' ? '4px' : 0,
                      pointerEvents: 'none', zIndex: 2
                    }}/>
                  ))}
                </div>

                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                  Hold your phone steady in front of the<br/>
                  <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Library Gate QR Code poster</strong> at the entrance
                </p>

                <button onClick={closeCamera} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <CameraOff size={15}/><span>Cancel</span>
                </button>
              </>
            )}

          </div>
        </div>
      )}

      <style>{`
        #${SCANNER_DIV_ID} video { width: 100% !important; border-radius: 6px; }
        #${SCANNER_DIV_ID} img   { display: none !important; }
      `}</style>
    </div>
  );
}
