import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useSocket } from '../../contexts/SocketContext';
import { QrCode, Camera, CameraOff, Check, X, Shield, Phone, AlertCircle } from 'lucide-react';

export default function RemoteScanner() {
  const [searchParams] = useSearchParams();
  const channel = searchParams.get('channel') || 'default_admin_scan';
  const socket = useSocket();

  const [camOpen, setCamOpen] = useState(false);
  const [camErr, setCamErr] = useState('');
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'scanning' | 'success' | 'error'
  const [scanMessage, setScanMessage] = useState('Ready to pair as remote scanner camera');
  
  const scannerRef = useRef(null);
  const DIV_ID = 'remote-scanner-view';

  // Join the socket room for this pairing channel
  useEffect(() => {
    if (socket && channel) {
      socket.emit('join_room', channel);
      console.log(`Connected remote phone to scan channel: ${channel}`);
    }
  }, [socket, channel]);

  // Stop camera helper
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {}
      try {
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setCamOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const beep = (ok) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(ok ? 880 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(ok ? 0.1 : 0.15, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (ok ? 0.12 : 0.25));
      osc.stop(ctx.currentTime + (ok ? 0.12 : 0.25));
    } catch (_) {}
  };

  // Start phone remote camera
  const startCamera = useCallback(async () => {
    setCamErr('');
    setScanStatus('scanning');
    setScanMessage('Remote Camera Active. Align QR code...');
    await new Promise(r => setTimeout(r, 200));

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setCamErr(`Camera requires HTTPS or localhost. To test on mobile, enable Chrome's flag: chrome://flags/#unsafely-treat-insecure-origin-as-secure and add http://${window.location.host}`);
      setScanStatus('error');
      setScanMessage('Secure Context Required');
      return;
    }

    const scanner = new Html5Qrcode(DIV_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          // Emit the scanned code to the admin scan desk via Socket
          if (socket) {
            socket.emit('remote_qr_scan', { room: channel, qrData: decoded });
          }

          // Visual and audio indicators on the phone
          beep(true);
          setScanStatus('success');
          setScanMessage('✓ Code Sent successfully!');
          
          setTimeout(() => {
            setScanStatus('scanning');
            setScanMessage('Remote Camera Active. Align next QR...');
          }, 1500);
        },
        () => {}
      );
      setCamOpen(true);
    } catch (err) {
      const msg = err?.message || 'Camera access denied.';
      setCamErr(msg);
      setScanStatus('error');
      setScanMessage('Could not launch camera');
    }
  }, [socket, channel]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #131912, #1c281a)',
      color: '#f1f3e0',
      fontFamily: 'Inter, sans-serif',
      padding: '1.5rem',
      textAlign: 'center'
    }}>
      
      {/* Remote Desk Scanner Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(210, 220, 182, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(161, 188, 152, 0.3)',
          color: 'var(--bg-base)'
        }}>
          <Phone size={28} style={{ color: '#d2dcb6' }} />
        </div>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>Remote Phone Scanner</h2>
        <span style={{
          fontSize: '0.8rem',
          color: '#a1bc98',
          background: 'rgba(161, 188, 152, 0.1)',
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'monospace'
        }}>
          Room: {channel.substring(0, 16)}...
        </span>
      </div>

      {/* Main Scanner Card Panel */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '360px',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(161, 188, 152, 0.2)',
        background: 'rgba(255, 255, 255, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        
        {/* Cam Frame Viewport */}
        <div style={{
          width: '100%',
          aspectRatio: '1',
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: '#0d0f0d',
          border: '2px dashed rgba(161, 188, 152, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          
          <div id={DIV_ID} style={{ width: '100%', height: '100%' }} />

          {/* Overlays when camera is off */}
          {!camOpen && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '1rem'
            }}>
              <CameraOff size={44} style={{ color: 'rgba(255,255,255,0.2)' }} />
              {camErr ? (
                <div style={{ color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} />
                  <span>{camErr}</span>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#a1bc98' }}>Camera is currently off</span>
              )}
            </div>
          )}

          {/* Aim Viewport Corners when active */}
          {camOpen && scanStatus === 'scanning' && (
            <>
              <div style={{ position: 'absolute', top: '15px', left: '15px', width: '20px', height: '20px', borderTop: '3px solid #d2dcb6', borderLeft: '3px solid #d2dcb6' }} />
              <div style={{ position: 'absolute', top: '15px', right: '15px', width: '20px', height: '20px', borderTop: '3px solid #d2dcb6', borderRight: '3px solid #d2dcb6' }} />
              <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '20px', height: '20px', borderBottom: '3px solid #d2dcb6', borderLeft: '3px solid #d2dcb6' }} />
              <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '20px', height: '20px', borderBottom: '3px solid #d2dcb6', borderRight: '3px solid #d2dcb6' }} />
            </>
          )}
        </div>

        {/* Scan Status Display Bar */}
        <div style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          background: scanStatus === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
          color: scanStatus === 'success' ? '#4ade80' : '#d2dcb6',
          fontSize: '0.9rem',
          fontWeight: 600,
          textAlign: 'center',
          transition: 'all 0.3s'
        }}>
          {scanMessage}
        </div>

        {/* Camera Control Action Trigger Buttons */}
        {!camOpen ? (
          <button onClick={startCamera} className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}>
            <Camera size={18} />
            Start Remote Camera
          </button>
        ) : (
          <button onClick={stopCamera} className="btn btn-danger" style={{ width: '100%', gap: '0.5rem' }}>
            <CameraOff size={18} />
            Stop Camera
          </button>
        )}
      </div>

      <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#a1bc98' }}>
        <Shield size={14} />
        <span>Secure end-to-end local network transaction channel</span>
      </div>
    </div>
  );
}
