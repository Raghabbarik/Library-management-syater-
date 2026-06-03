import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { useSocket } from '../../contexts/SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode, BookOpen, User, Check, X,
  Camera, CameraOff, AlertTriangle, RefreshCw, CheckCircle,
  Search, LogIn, LogOut, UserCheck, AlertCircle,
  ArrowDownLeft, ArrowUpRight, Clock, Shield, Phone, Wifi, WifiOff
} from 'lucide-react';

/* ── stop & clear Html5Qrcode ── */
async function safeStop(ref) {
  if (ref.current) {
    try { await ref.current.stop(); } catch (_) {}
    try { ref.current.clear(); }    catch (_) {}
    ref.current = null;
  }
}

export default function AdminScanner({ fetchInsideCount }) {
  const socket = useSocket();
  const [scanMode, setScanMode] = useState('gate-entry');

  /* ── shared data ── */
  const [allStudents, setAllStudents]   = useState([]);
  const [activeBorrowings, setActiveBorrowings] = useState([]);

  /* ── remote phone camera integration ── */
  const [channelId] = useState(() => 'desk_' + Math.random().toString(36).substring(2, 9));
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);

  /* ════════════════════════════════════════
     GATE ENTRY  — camera → student QR
  ════════════════════════════════════════ */
  const entryScannerRef = useRef(null);
  const ENTRY_DIV_ID    = 'html5qr-entry';

  const [entryCamOpen,  setEntryCamOpen]  = useState(false);
  const [entryCamErr,   setEntryCamErr]   = useState('');
  const [entryStudent,  setEntryStudent]  = useState(null);   // verified student
  const [entryResult,   setEntryResult]   = useState(null);   // {ok, msg}

  /* ════════════════════════════════════════
     GATE EXIT   — list of inside students → Exit button
  ════════════════════════════════════════ */
  const [insideStudents, setInsideStudents] = useState([]);
  const [exitingId,      setExitingId]      = useState(null);
  const [exitResult,     setExitResult]     = useState(null); // {ok, msg, name}
  const [insideLoading,  setInsideLoading]  = useState(false);

  /* ════════════════════════════════════════
     CHECKOUT  — camera → book QR
  ════════════════════════════════════════ */
  const checkoutScannerRef = useRef(null);
  const CHECKOUT_DIV_ID    = 'html5qr-checkout';

  const [checkoutCamOpen,  setCheckoutCamOpen]  = useState(false);
  const [checkoutCamErr,   setCheckoutCamErr]   = useState('');
  const [scannedBook,      setScannedBook]       = useState(null);
  const [bookRequests,     setBookRequests]      = useState([]);
  const [checkoutStudent,  setCheckoutStudent]   = useState(null);
  const [studentSearch,    setStudentSearch]     = useState('');
  const [studentDropOpen,  setStudentDropOpen]   = useState(false);
  const [issuing,          setIssuing]           = useState(false);
  const [checkoutResult,   setCheckoutResult]    = useState(null);

  /* ════════════════════════════════════════
     CHECKIN  — camera → student QR → return book
  ════════════════════════════════════════ */
  const checkinScannerRef = useRef(null);
  const CHECKIN_DIV_ID    = 'html5qr-checkin';

  const [checkinCamOpen,   setCheckinCamOpen]   = useState(false);
  const [checkinCamErr,    setCheckinCamErr]     = useState('');
  const [scannedStudent,   setScannedStudent]    = useState(null);
  const [selectedReturnTx, setSelectedReturnTx]  = useState(null);
  const [returning,        setReturning]         = useState(false);
  const [checkinResult,    setCheckinResult]     = useState(null);

  /* ── HUD ── */
  const [terminalLogs,    setTerminalLogs]    = useState([
    { time: new Date().toLocaleTimeString(), text: 'Scanner HUD Initialized.', type: 'info' }
  ]);
  const [hudStatus,       setHudStatus]       = useState('idle');
  const [hudMessage,      setHudMessage]      = useState('Ready to Scan');

  const addLog = (text, type = 'info') =>
    setTerminalLogs(prev => [{ time: new Date().toLocaleTimeString(), text, type }, ...prev.slice(0, 29)]);

  /* ── load data ── */
  const loadData = useCallback(async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        axios.get('/api/users?limit=200'),
        axios.get('/api/transactions?status=active&limit=200'),
      ]);
      if (uRes.data.success) setAllStudents(uRes.data.data);
      if (tRes.data.success) setActiveBorrowings(tRes.data.data);
    } catch (e) { console.error('loadData', e); }
  }, []);

  const loadInsideStudents = useCallback(async () => {
    setInsideLoading(true);
    try {
      const res = await axios.get('/api/scan/inside');
      if (res.data.success) setInsideStudents(res.data.data);
    } catch (e) { console.error('inside', e); }
    finally { setInsideLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, []);

  /* When switching to exit mode, refresh inside list */
  useEffect(() => {
    if (scanMode === 'gate-exit') loadInsideStudents();
  }, [scanMode]);

  /* stop cameras when switching modes */
  useEffect(() => {
    if (scanMode !== 'gate-entry') safeStop(entryScannerRef).then(() => setEntryCamOpen(false));
    if (scanMode !== 'checkout')   safeStop(checkoutScannerRef).then(() => setCheckoutCamOpen(false));
    if (scanMode !== 'checkin')    safeStop(checkinScannerRef).then(() => setCheckinCamOpen(false));
  }, [scanMode]);

  useEffect(() => () => {
    safeStop(entryScannerRef);
    safeStop(checkoutScannerRef);
    safeStop(checkinScannerRef);
  }, []);


  /* ── beep ── */
  const beep = (ok) => {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(ok ? 880 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(ok ? 0.08 : 0.12, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (ok ? 0.12 : 0.25));
      osc.stop(ctx.currentTime + (ok ? 0.12 : 0.25));
    } catch (_) {}
  };

  /* ════════════════════════════════════════════════
     DECODING & SCAN LOGIC HANDLERS
  ════════════════════════════════════════════════ */
  const handleGateEntryScan = useCallback(async (decoded) => {
    setHudStatus('scanning'); setHudMessage('Verifying student identity…');
    addLog(`QR decoded: ${decoded.slice(0, 50)}`, 'info');

    try {
      let parsed;
      try { parsed = JSON.parse(decoded); } catch { throw new Error('Invalid QR — not a student library card.'); }
      const uid = parsed.userId;
      if (!uid) throw new Error('QR is not a valid student identity card.');

      /* Log the ENTRY via backend */
      const res = await axios.post('/api/scan', {
        qrData: decoded,
        type: 'entry'
      });

      if (res.data.success) {
        const u = res.data.user;
        setEntryStudent({ name: u.name, studentId: u.studentId, pendingFines: u.pendingFines });
        setEntryResult({ ok: true, msg: `Entry recorded for ${u.name}` });
        beep(true);
        setHudStatus('success'); setHudMessage(`✓ Access Granted: ${u.name}`);
        addLog(`ENTRY: ${u.name} (${u.studentId})`, 'success');
        fetchInsideCount();
        loadInsideStudents();
      }
    } catch (err) {
      beep(false);
      const msg = err.response?.data?.message || err.message;
      setEntryResult({ ok: false, msg });
      setHudStatus('error'); setHudMessage(`Denied: ${msg}`);
      addLog(`ENTRY ERR: ${msg}`, 'error');
    }
  }, [fetchInsideCount, loadInsideStudents]);

  const handleCheckoutScan = useCallback(async (decoded) => {
    setHudStatus('scanning'); setHudMessage('Verifying book…');
    addLog(`QR: ${decoded.slice(0, 50)}`, 'info');
    try {
      let parsed;
      try { parsed = JSON.parse(decoded); } catch { throw new Error('Invalid QR — not a library book label.'); }
      if (!parsed.bookId) throw new Error('QR is not a valid book label.');

      const bRes = await axios.get(`/api/books/${parsed.bookId}`);
      if (!bRes.data.success) throw new Error('Book not found.');
      setScannedBook(bRes.data.data);

      const rRes = await axios.get(`/api/transactions?type=request&status=pending&bookId=${parsed.bookId}`);
      if (rRes.data.success) setBookRequests(rRes.data.data);

      beep(true);
      setHudStatus('success'); setHudMessage(`✓ Book: "${bRes.data.data.title}"`);
      addLog(`BOOK SCAN: "${bRes.data.data.title}"`, 'success');
    } catch (err) {
      beep(false);
      const msg = err.response?.data?.message || err.message;
      setHudStatus('error'); setHudMessage(`Error: ${msg}`);
      addLog(`SCAN ERR: ${msg}`, 'error');
    }
  }, []);

  const handleCheckinScan = useCallback(async (decoded) => {
    setHudStatus('scanning'); setHudMessage('Looking up student…');
    addLog(`QR: ${decoded.slice(0, 50)}`, 'info');
    try {
      let parsed;
      try { parsed = JSON.parse(decoded); } catch { throw new Error('Invalid QR — not a student identity card.'); }
      const uid = parsed.userId;
      if (!uid) throw new Error('QR is not a valid student identity card.');

      const uRes = await axios.get(`/api/users/${uid}`);
      if (!uRes.data.success) throw new Error('Student not found.');

      const { user, activeTransactions } = uRes.data.data;
      setScannedStudent({ user, borrows: activeTransactions || [] });
      beep(true);
      setHudStatus('success'); setHudMessage(`✓ Identity: ${user.name}`);
      addLog(`STUDENT: ${user.name} — ${(activeTransactions||[]).length} book(s)`, 'success');
    } catch (err) {
      beep(false);
      const msg = err.response?.data?.message || err.message;
      setHudStatus('error'); setHudMessage(`Error: ${msg}`);
      addLog(`SCAN ERR: ${msg}`, 'error');
    }
  }, []);

  /* Subscribe to Remote Phone Scanner over Socket.io — placed AFTER handlers are defined */
  useEffect(() => {
    if (socket && channelId) {
      socket.emit('join_room', channelId);
      console.log(`📡 Desk scanner listening on remote scan room: ${channelId}`);

      const handleRemoteQR = (data) => {
        if (data && data.qrData) {
          beep(true);
          setRemoteConnected(true);
          addLog(`📱 Remote phone scan received!`, 'success');

          // Call the appropriate handler matching current mode
          if (scanMode === 'gate-entry') {
            safeStop(entryScannerRef).then(() => setEntryCamOpen(false));
            handleGateEntryScan(data.qrData);
          } else if (scanMode === 'checkout') {
            safeStop(checkoutScannerRef).then(() => setCheckoutCamOpen(false));
            handleCheckoutScan(data.qrData);
          } else if (scanMode === 'checkin') {
            safeStop(checkinScannerRef).then(() => setCheckinCamOpen(false));
            handleCheckinScan(data.qrData);
          }
        }
      };

      socket.on('remote_qr_received', handleRemoteQR);
      return () => {
        socket.off('remote_qr_received', handleRemoteQR);
      };
    }
  }, [socket, channelId, scanMode, handleGateEntryScan, handleCheckoutScan, handleCheckinScan]);

  /* ════════════════════════════════════════════════
     GATE ENTRY: camera → scan student identity QR
  ════════════════════════════════════════════════ */
  const startEntryCamera = useCallback(async () => {
    setEntryCamErr(''); setEntryStudent(null); setEntryResult(null);
    setHudStatus('scanning'); setHudMessage('Point camera at the student\'s library card QR…');
    await new Promise(r => setTimeout(r, 200));

    const scanner = new Html5Qrcode(ENTRY_DIV_ID);
    entryScannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await safeStop(entryScannerRef);
          await handleGateEntryScan(decoded);
        },
        () => {}
      );
      addLog('Camera live — waiting for student library card QR…', 'info');
    } catch (err) {
      const msg = err?.message || 'Camera access denied.';
      setEntryCamErr(msg);
      setHudStatus('error'); setHudMessage('Camera error.');
      addLog(`CAMERA ERR: ${msg}`, 'error');
    }
  }, [handleGateEntryScan]);

  const openEntryCamera = () => {
    setEntryCamOpen(true);
    setEntryStudent(null); setEntryResult(null);
    startEntryCamera();
  };
  const closeEntryCamera = () => {
    safeStop(entryScannerRef); setEntryCamOpen(false);
    setHudStatus('idle'); setHudMessage('Ready to Scan');
  };
  const resetEntry = () => {
    setEntryStudent(null); setEntryResult(null); setEntryCamOpen(false);
    setHudStatus('idle'); setHudMessage('Ready to Scan');
  };

  /* ════════════════════════════════════════════════
     GATE EXIT: list of inside students + Exit button
  ════════════════════════════════════════════════ */
  const handleExitStudent = async (uid, name) => {
    setExitingId(uid); setExitResult(null);
    setHudStatus('scanning'); setHudMessage(`Logging exit for ${name}…`);
    try {
      const res = await axios.post(`/api/scan/exit/${uid}`);
      if (res.data.success) {
        beep(true);
        setHudStatus('success'); setHudMessage(`✓ Exit recorded: ${name}`);
        setExitResult({ ok: true, msg: `Exit logged for ${name}` });
        addLog(`EXIT: ${name}`, 'success');
        fetchInsideCount();
        /* remove from inside list immediately */
        setInsideStudents(prev => prev.filter(s => s._id !== uid));
        setTimeout(() => setExitResult(null), 4000);
      }
    } catch (err) {
      beep(false);
      const msg = err.response?.data?.message || 'Exit failed.';
      setHudStatus('error'); setHudMessage(`Error: ${msg}`);
      setExitResult({ ok: false, msg });
      addLog(`EXIT ERR: ${msg}`, 'error');
    } finally { setExitingId(null); }
  };

  /* ════════════════════════════════════════════════
     CHECKOUT: camera → book QR
  ════════════════════════════════════════════════ */
  const startCheckoutCamera = useCallback(async () => {
    setCheckoutCamErr('');
    setScannedBook(null); setBookRequests([]); setCheckoutStudent(null);
    setCheckoutResult(null); setStudentSearch('');
    setHudStatus('scanning'); setHudMessage('Point camera at the book QR label…');
    await new Promise(r => setTimeout(r, 200));

    const scanner = new Html5Qrcode(CHECKOUT_DIV_ID);
    checkoutScannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await safeStop(checkoutScannerRef);
          await handleCheckoutScan(decoded);
        },
        () => {}
      );
      addLog('Camera live — waiting for book QR…', 'info');
    } catch (err) {
      const msg = err?.message || 'Camera access denied.';
      setCheckoutCamErr(msg);
      setHudStatus('error'); setHudMessage('Camera error.');
      addLog(`CAMERA ERR: ${msg}`, 'error');
    }
  }, [handleCheckoutScan]);

  const openCheckoutCamera = () => { setCheckoutCamOpen(true); startCheckoutCamera(); };
  const closeCheckoutCamera = () => { safeStop(checkoutScannerRef); setCheckoutCamOpen(false); setHudStatus('idle'); setHudMessage('Ready to Scan'); };
  const rescanCheckout = () => { setScannedBook(null); setBookRequests([]); setCheckoutStudent(null); setCheckoutResult(null); setStudentSearch(''); startCheckoutCamera(); };

  const handleIssueBook = async () => {
    if (!scannedBook || !checkoutStudent) return;
    setIssuing(true); setCheckoutResult(null);
    setHudStatus('scanning'); setHudMessage('Processing checkout…');
    try {
      const res = await axios.post('/api/transactions/issue', { userId: checkoutStudent._id, bookId: scannedBook._id });
      if (res.data.success) {
        beep(true);
        setHudStatus('success'); setHudMessage('Checkout Complete!');
        setCheckoutResult({ ok: true, msg: `"${scannedBook.title}" issued to ${checkoutStudent.name}.` });
        addLog(`CHECKOUT: "${scannedBook.title}" → ${checkoutStudent.name}`, 'success');
        loadData();
      }
    } catch (err) {
      beep(false);
      const msg = err.response?.data?.message || 'Checkout failed.';
      setHudStatus('error'); setHudMessage(`Error: ${msg}`);
      setCheckoutResult({ ok: false, msg });
      addLog(`CHECKOUT ERR: ${msg}`, 'error');
    } finally { setIssuing(false); }
  };

  const resetCheckout = () => { setScannedBook(null); setBookRequests([]); setCheckoutStudent(null); setCheckoutResult(null); setStudentSearch(''); setCheckoutCamOpen(false); setHudStatus('idle'); setHudMessage('Ready to Scan'); };

  /* ════════════════════════════════════════════════
     CHECKIN: camera → student QR → return book
  ════════════════════════════════════════════════ */
  const startCheckinCamera = useCallback(async () => {
    setCheckinCamErr('');
    setScannedStudent(null); setSelectedReturnTx(null); setCheckinResult(null);
    setHudStatus('scanning'); setHudMessage('Point camera at the student\'s library card QR…');
    await new Promise(r => setTimeout(r, 200));

    const scanner = new Html5Qrcode(CHECKIN_DIV_ID);
    checkinScannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await safeStop(checkinScannerRef);
          await handleCheckinScan(decoded);
        },
        () => {}
      );
      addLog('Camera live — waiting for student identity QR…', 'info');
    } catch (err) {
      const msg = err?.message || 'Camera access denied.';
      setCheckinCamErr(msg);
      setHudStatus('error'); setHudMessage('Camera error.');
      addLog(`CAMERA ERR: ${msg}`, 'error');
    }
  }, [handleCheckinScan]);

  const openCheckinCamera = () => { setCheckinCamOpen(true); startCheckinCamera(); };
  const closeCheckinCamera = () => { safeStop(checkinScannerRef); setCheckinCamOpen(false); setHudStatus('idle'); setHudMessage('Ready to Scan'); };
  const rescanCheckin = () => { setScannedStudent(null); setSelectedReturnTx(null); setCheckinResult(null); startCheckinCamera(); };

  const handleReturnBook = async () => {
    if (!selectedReturnTx) return;
    setReturning(true); setCheckinResult(null);
    setHudStatus('scanning'); setHudMessage('Processing return…');
    try {
      const res = await axios.post('/api/transactions/return', { transactionId: selectedReturnTx._id });
      if (res.data.success) {
        beep(true);
        const fine = res.data.fine;
        const fineMsg = fine > 0 ? ` Fine: ₹${fine}` : ' No fine.';
        setHudStatus('success'); setHudMessage('Return Confirmed!');
        setCheckinResult({ ok: true, msg: `"${selectedReturnTx.book?.title}" returned.${fineMsg}`, fine });
        addLog(`RETURNED: "${selectedReturnTx.book?.title}"${fineMsg}`, 'success');
        const uRes = await axios.get(`/api/users/${scannedStudent.user._id}`);
        if (uRes.data.success) setScannedStudent({ user: uRes.data.data.user, borrows: uRes.data.data.activeTransactions || [] });
        setSelectedReturnTx(null);
        loadData();
      }
    } catch (err) {
      beep(false);
      const msg = err.response?.data?.message || 'Return failed.';
      setHudStatus('error'); setHudMessage(`Error: ${msg}`);
      setCheckinResult({ ok: false, msg });
      addLog(`RETURN ERR: ${msg}`, 'error');
    } finally { setReturning(false); }
  };

  const resetCheckin = () => { setScannedStudent(null); setSelectedReturnTx(null); setCheckinResult(null); setCheckinCamOpen(false); setHudStatus('idle'); setHudMessage('Ready to Scan'); };

  /* ── helpers ── */
  const filteredStudents = allStudents.filter(s =>
    !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.studentId?.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const daysOverdue = (dueDate) => Math.ceil((new Date() - new Date(dueDate)) / 86400000);

  /* ── HUD icon ── */
  const HudIcon = () => {
    if (hudStatus === 'success') return <Check size={48} color="#4ade80"/>;
    if (hudStatus === 'error')   return <X size={48} color="#f87171"/>;
    const pulse = hudStatus === 'scanning' ? 'animate-pulse' : '';
    if (scanMode === 'gate-entry') return <ArrowDownLeft size={48} color="#38bdf8" className={pulse}/>;
    if (scanMode === 'gate-exit')  return <ArrowUpRight size={48} color="#38bdf8" className={pulse}/>;
    if (scanMode === 'checkout')   return <Camera size={48} color="#38bdf8" className={pulse}/>;
    if (scanMode === 'checkin')    return <UserCheck size={48} color="#38bdf8" className={pulse}/>;
    return <QrCode size={48} color="#38bdf8"/>;
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

      {/* ══ LEFT: Controls ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>Scan Mode Controls</h3>

          {/* Mode buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              { id: 'gate-entry', icon: <ArrowDownLeft size={16}/>, label: 'Gate Entry' },
              { id: 'gate-exit',  icon: <ArrowUpRight  size={16}/>, label: 'Gate Exit'  },
              { id: 'checkout',   icon: <Camera        size={16}/>, label: 'Check-Out'  },
              { id: 'checkin',    icon: <LogIn         size={16}/>, label: 'Check-In'   },
            ].map(m => (
              <button key={m.id}
                className={`btn ${scanMode === m.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.25rem' }}
                onClick={() => { setScanMode(m.id); setHudStatus('idle'); setHudMessage(`Ready for ${m.label}`); }}
              >
                {m.icon}<span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Phone camera connector widget */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: remoteConnected ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: remoteConnected ? 'var(--success)' : 'var(--warning)',
                position: 'relative'
              }}>
                <Phone size={18} />
                <span className="pulse-dot" style={{
                  position: 'absolute', top: '-1px', right: '-1px', width: '8px', height: '8px', borderRadius: '50%',
                  background: remoteConnected ? 'var(--success)' : 'var(--warning)'
                }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Phone Camera</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {remoteConnected ? 'Connected & Active' : 'Not Connected'}
                </span>
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem' }}
              onClick={() => setShowRemoteModal(true)}
            >
              {remoteConnected ? <Wifi size={14} /> : <Phone size={14} />}
              <span>{remoteConnected ? 'Manage' : 'Connect'}</span>
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ════ GATE ENTRY ════ */}
            {scanMode === 'gate-entry' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                  background: 'rgba(0,242,254,0.05)', border: '1px solid rgba(0,242,254,0.2)', color: 'var(--text-secondary)',
                  display: 'flex', gap: '0.5rem', alignItems: 'center'
                }}>
                  <Shield size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }}/>
                  <span>Open the camera and scan the student's <strong>SmartLib library card QR</strong> to log their entry.</span>
                </div>

                {/* Camera closed, no result yet */}
                {!entryCamOpen && !entryResult && (
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,242,254,0.1)', border: '2px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowDownLeft size={36} color="var(--accent-cyan)"/>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={openEntryCamera}>
                      <Camera size={18}/><span>Open Camera & Scan Student QR</span>
                    </button>
                  </div>
                )}

                {/* Camera open */}
                {entryCamOpen && !entryStudent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>📷 Scan Library Card QR</span>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={closeEntryCamera}>
                        <CameraOff size={14}/><span>Cancel</span>
                      </button>
                    </div>
                    {entryCamErr && <CameraError msg={entryCamErr}/>}
                    <div id={ENTRY_DIV_ID} style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--accent-cyan)', boxShadow: '0 0 20px rgba(0,242,254,0.15)', minHeight: '220px', background: '#000' }}/>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Ask the student to show their SmartLib digital card QR code</p>
                  </div>
                )}

                {/* Student verified */}
                {entryStudent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.3)' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {entryStudent.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 700 }}>{entryStudent.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {entryStudent.studentId}</span>
                        {entryStudent.pendingFines > 0 && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>⚠ Pending Fine: ₹{entryStudent.pendingFines}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <CheckCircle size={18}/><span>Access Granted</span>
                      </div>
                    </div>

                    <ResultBanner ok={entryResult?.ok} msg={entryResult?.msg || ''}/>

                    <button className="btn btn-primary" onClick={openEntryCamera}>
                      <Camera size={16}/><span>Scan Next Student</span>
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={resetEntry}>
                      <X size={14}/><span>Close</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ════ GATE EXIT ════ */}
            {scanMode === 'gate-exit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <ArrowUpRight size={15} color="var(--warning)" style={{ flexShrink: 0 }}/>
                  <span>Select the student leaving the library and click the <strong>Exit</strong> button to log their exit.</span>
                </div>

                {exitResult && <ResultBanner ok={exitResult.ok} msg={exitResult.msg}/>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Currently Inside ({insideStudents.length})</span>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={loadInsideStudents} disabled={insideLoading}>
                    <RefreshCw size={13} className={insideLoading ? 'animate-spin' : ''}/><span>Refresh</span>
                  </button>
                </div>

                {insideLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</div>
                ) : insideStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <ArrowDownLeft size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }}/>
                    <p style={{ margin: 0 }}>No students currently inside the library.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '360px', overflowY: 'auto' }}>
                    {insideStudents.map(s => {
                      const isExiting = exitingId === s._id;
                      const enteredMins = s.enteredAt ? Math.floor((new Date() - new Date(s.enteredAt)) / 60000) : null;
                      return (
                        <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                          {/* Avatar */}
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-cyan),var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'white', flexShrink: 0 }}>
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {s.studentId || 'N/A'}
                              {enteredMins !== null && (
                                <span style={{ marginLeft: '0.5rem', color: 'var(--accent-cyan)' }}>
                                  <Clock size={10} style={{ display: 'inline', marginRight: '2px' }}/>
                                  {enteredMins < 60 ? `${enteredMins}m` : `${Math.floor(enteredMins/60)}h ${enteredMins%60}m`}
                                </span>
                              )}
                            </span>
                          </div>
                          {/* Exit button */}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--warning)', flexShrink: 0 }}
                            onClick={() => handleExitStudent(s._id, s.name)}
                            disabled={isExiting}
                          >
                            {isExiting ? <RefreshCw size={13} className="animate-spin"/> : <LogOut size={13}/>}
                            <span>{isExiting ? '…' : 'Exit'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════ CHECKOUT (book QR camera) ════ */}
            {scanMode === 'checkout' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {!checkoutCamOpen && !scannedBook && (
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,242,254,0.1)', border: '2px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={36} color="var(--accent-cyan)"/>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Scan the book's QR label to begin checkout</p>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={openCheckoutCamera}>
                      <Camera size={18}/><span>Open Camera & Scan Book QR</span>
                    </button>
                  </div>
                )}

                {checkoutCamOpen && !scannedBook && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>📷 Scan Book QR Label</span>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={closeCheckoutCamera}>
                        <CameraOff size={14}/><span>Cancel</span>
                      </button>
                    </div>
                    {checkoutCamErr && <CameraError msg={checkoutCamErr}/>}
                    <div id={CHECKOUT_DIV_ID} style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--accent-cyan)', boxShadow: '0 0 20px rgba(0,242,254,0.15)', minHeight: '220px', background: '#000' }}/>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Hold the QR label steady inside the frame</p>
                  </div>
                )}

                {scannedBook && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <BookCard book={scannedBook}/>
                    {bookRequests.length > 0 && (
                      <div>
                        <span style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Students who requested this book:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {bookRequests.map(req => (
                            <button key={req._id} onClick={() => { setCheckoutStudent(req.user); setStudentSearch(req.user?.name||''); }} className="btn btn-secondary"
                              style={{ justifyContent: 'flex-start', padding: '0.45rem 0.8rem', fontSize: '0.8rem', border: checkoutStudent?._id===(req.user?._id||req.user?.id) ? '2px solid var(--accent-cyan)' : '1px solid var(--glass-border)' }}>
                              <User size={13} style={{ marginRight: '0.4rem' }}/><span>{req.user?.name} ({req.user?.studentId})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!checkoutResult?.ok && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {bookRequests.length > 0 ? 'Or assign to another student:' : 'Assign to Student:'}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}/>
                          <input type="text" placeholder="Search student name or ID…" value={studentSearch}
                            onChange={e => { setStudentSearch(e.target.value); setStudentDropOpen(true); setCheckoutStudent(null); }}
                            onFocus={() => setStudentDropOpen(true)}
                            style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}/>
                          {checkoutStudent && <CheckCircle size={15} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)' }}/>}
                          {studentDropOpen && studentSearch && !checkoutStudent && filteredStudents.length > 0 && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', maxHeight: '180px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                              {filteredStudents.slice(0,8).map(s => (
                                <div key={s._id} onClick={() => { setCheckoutStudent(s); setStudentSearch(s.name); setStudentDropOpen(false); }}
                                  style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-surface-hover)'}
                                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                  <User size={13} color="var(--text-muted)"/>
                                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({s.studentId})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {checkoutStudent && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(0,242,254,0.06)', border: '1px solid rgba(0,242,254,0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span><strong>{checkoutStudent.name}</strong><span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({checkoutStudent.studentId})</span></span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{checkoutStudent.department}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {checkoutResult && <ResultBanner ok={checkoutResult.ok} msg={checkoutResult.msg}/>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {!checkoutResult?.ok ? (
                        <button className="btn btn-primary" onClick={handleIssueBook} disabled={!checkoutStudent || scannedBook.availableCopies < 1 || issuing}>
                          {issuing ? <RefreshCw size={16} className="animate-spin"/> : <Check size={16}/>}
                          <span>{issuing ? 'Issuing…' : 'Confirm & Issue Book'}</span>
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={resetCheckout}><Camera size={16}/><span>New Checkout</span></button>
                      )}
                      <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={rescanCheckout}>
                        <RefreshCw size={14}/><span>Re-Scan Different Book</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════ CHECKIN (return) ════ */}
            {scanMode === 'checkin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {!checkinCamOpen && !scannedStudent && (
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(162,203,139,0.1)', border: '2px solid #a2cb8b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCheck size={36} color="#a2cb8b"/>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Scan the student's library card QR to see their borrowed books</p>
                    <button className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg,#5c8a4a,#3d6b2e)' }} onClick={openCheckinCamera}>
                      <Camera size={18}/><span>Open Camera & Scan Student QR</span>
                    </button>
                  </div>
                )}

                {checkinCamOpen && !scannedStudent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a2cb8b' }}>📷 Scan Student Identity QR</span>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={closeCheckinCamera}>
                        <CameraOff size={14}/><span>Cancel</span>
                      </button>
                    </div>
                    {checkinCamErr && <CameraError msg={checkinCamErr}/>}
                    <div id={CHECKIN_DIV_ID} style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid #a2cb8b', boxShadow: '0 0 20px rgba(162,203,139,0.15)', minHeight: '220px', background: '#000' }}/>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Ask the student to show their SmartLib digital card QR</p>
                  </div>
                )}

                {scannedStudent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <StudentCard user={scannedStudent.user}/>

                    <div>
                      <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Borrowed Books ({scannedStudent.borrows.length})
                      </span>
                      {scannedStudent.borrows.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <BookOpen size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }}/>
                          <p style={{ margin: 0 }}>No books currently borrowed.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {scannedStudent.borrows.map(tx => {
                            const od = daysOverdue(tx.dueDate);
                            const isOverdue = od > 0;
                            const isSelected = selectedReturnTx?._id === tx._id;
                            return (
                              <button key={tx._id} onClick={() => { setSelectedReturnTx(isSelected ? null : tx); setCheckinResult(null); }}
                                style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                                  border: isSelected ? '2px solid #a2cb8b' : isOverdue ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--glass-border)',
                                  background: isSelected ? 'rgba(162,203,139,0.08)' : isOverdue ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)',
                                  cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}>
                                <div style={{ width: '40px', height: '56px', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                                  {tx.book?.coverImage ? <img src={tx.book.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <BookOpen size={18} color="var(--text-muted)"/>}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.book?.title}</span>
                                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>by {tx.book?.author}</span>
                                  <span style={{ display: 'block', fontSize: '0.7rem', marginTop: '0.2rem', color: isOverdue ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                                    {isOverdue ? `⚠ ${od}d overdue` : `Due: ${new Date(tx.dueDate).toLocaleDateString()}`}
                                  </span>
                                </div>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: isSelected ? '#a2cb8b' : 'rgba(255,255,255,0.06)', border: `1px solid ${isSelected ? '#a2cb8b' : 'var(--glass-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {isSelected && <Check size={12} color="#fff"/>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedReturnTx && (() => {
                      const od = daysOverdue(selectedReturnTx.dueDate);
                      const fine = od > 0 ? od * 2 : 0;
                      return fine > 0 ? (
                        <div style={{ padding: '0.65rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--danger)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <AlertCircle size={15}/><span>Overdue by {od} day(s) — fine: <strong>₹{fine}</strong></span>
                        </div>
                      ) : (
                        <div style={{ padding: '0.65rem 1rem', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--success)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <CheckCircle size={15}/><span>Returned on time — no fine.</span>
                        </div>
                      );
                    })()}

                    {checkinResult && <ResultBanner ok={checkinResult.ok} msg={checkinResult.msg}/>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ background: selectedReturnTx ? 'linear-gradient(135deg,#5c8a4a,#3d6b2e)' : undefined }}
                        onClick={handleReturnBook} disabled={!selectedReturnTx || returning}>
                        {returning ? <RefreshCw size={16} className="animate-spin"/> : <LogIn size={16}/>}
                        <span>{returning ? 'Processing…' : 'Confirm Check-In (Return)'}</span>
                      </button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={rescanCheckin}>
                        <RefreshCw size={14}/><span>Scan Different Student</span>
                      </button>
                      {checkinResult?.ok && scannedStudent.borrows.length === 0 && (
                        <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={resetCheckin}>
                          <Camera size={14}/><span>New Check-In Session</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Library Gate QR Poster */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', width: '100%', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>Library Gate QR Code Poster</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hangs at the library entrance. Students scan this QR to log gate entry/exit times.</p>
          <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'inline-block', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=%7B%22type%22%3A%22library-gate%22%7D" alt="Gate QR" style={{ width: '180px', height: '180px' }}/>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => window.open("https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=%7B%22type%22%3A%22library-gate%22%7D","_blank")}>
            Open Printable QR Poster
          </button>
        </div>
      </div>

      {/* ══ RIGHT: HUD + Logs + Steps ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* HUD */}
        <div className="glass-panel" style={{ height: '240px', background: '#040409', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(56,189,248,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.08) 1px,transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }}/>
          {hudStatus === 'scanning' && <div style={{ position: 'absolute', left: 0, right: 0, height: '3px', background: '#38bdf8', boxShadow: '0 0 12px #38bdf8', animation: 'laserScroll 2s linear infinite', zIndex: 2 }}/>}
          <div style={{ width: '120px', height: '120px', border: hudStatus==='success' ? '2px solid #4ade80' : hudStatus==='error' ? '2px solid #f87171' : '2px dashed #38bdf8', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', zIndex: 1, background: hudStatus==='scanning' ? 'rgba(56,189,248,0.05)' : 'rgba(0,0,0,0.5)' }}>
            <HudIcon/>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, zIndex: 1, textAlign: 'center', padding: '0 1rem', color: hudStatus==='success' ? '#4ade80' : hudStatus==='error' ? '#f87171' : '#38bdf8' }}>
            {hudMessage}
          </div>
        </div>

        {/* Terminal */}
        <div className="glass-panel" style={{ padding: '1.25rem', height: '240px', display: 'flex', flexDirection: 'column', background: '#030307', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: '0.8rem', overflowY: 'auto' }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: '#38bdf8', fontWeight: 'bold' }}>TERMINAL HUD OUTPUT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {terminalLogs.map((log, i) => (
              <div key={i} style={{ color: log.type==='success' ? '#4ade80' : log.type==='error' ? '#f87171' : '#e2e8f0' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: '0.5rem' }}>[{log.time}]</span>{log.text}
              </div>
            ))}
          </div>
        </div>

        {/* Step guide */}
        {(scanMode === 'gate-entry' || scanMode === 'checkout' || scanMode === 'checkin') && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif',
              color: scanMode==='gate-entry' ? 'var(--accent-cyan)' : scanMode==='checkin' ? '#a2cb8b' : 'var(--accent-cyan)' }}>
              📋 {scanMode === 'gate-entry' ? 'Gate Entry Flow' : scanMode === 'checkout' ? 'Check-Out Flow' : 'Check-In Flow'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(scanMode === 'gate-entry' ? [
                { text: 'Open Camera', done: entryCamOpen || !!entryStudent },
                { text: 'Scan student\'s library card QR', done: !!entryStudent },
                { text: 'Entry automatically logged ✓', done: entryResult?.ok === true },
              ] : scanMode === 'checkout' ? [
                { text: 'Open Camera & scan book QR label', done: !!scannedBook || checkoutCamOpen },
                { text: 'Verify book details', done: !!scannedBook },
                { text: 'Select student to assign book', done: !!checkoutStudent },
                { text: 'Confirm & Issue Book', done: checkoutResult?.ok === true },
              ] : [
                { text: 'Open Camera & scan student QR', done: !!scannedStudent || checkinCamOpen },
                { text: 'Verify identity & see borrowed books', done: !!scannedStudent },
                { text: 'Select the book being returned', done: !!selectedReturnTx },
                { text: 'Confirm Check-In (Return)', done: checkinResult?.ok === true },
              ]).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700,
                    background: s.done ? 'var(--success-bg)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${s.done ? 'var(--success)' : 'var(--glass-border)'}`,
                    color: s.done ? 'var(--success)' : 'var(--text-muted)' }}>
                    {s.done ? <Check size={12}/> : i+1}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: s.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate exit quick stat */}
        {scanMode === 'gate-exit' && (
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', color: 'var(--warning)' }}>🚪 Gate Exit Panel</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Students are listed on the left as they entered today. Click the yellow <strong>Exit</strong> button next to each student's name to log their library exit. No QR scanning is needed on exit.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes laserScroll { 0%{top:0%} 50%{top:100%} 100%{top:0%} }
        .table-row-hover:hover { background: rgba(255,255,255,0.015); }
        #${ENTRY_DIV_ID} video, #${CHECKOUT_DIV_ID} video, #${CHECKIN_DIV_ID} video { width:100%!important; border-radius:6px; }
        #${ENTRY_DIV_ID} img,  #${CHECKOUT_DIV_ID} img,  #${CHECKIN_DIV_ID} img  { display:none!important; }
      `}</style>

      {/* Phone Pairing Modal Overlay */}
      {showRemoteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(19, 25, 18, 0.75)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '380px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            textAlign: 'center',
            border: '1px solid rgba(161, 188, 152, 0.3)',
            background: 'rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>Connect Phone Camera</h3>
              <button 
                onClick={() => setShowRemoteModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Scan this QR code with your phone camera to pair it as a wireless desk scanner.
            </p>

            {/* Pairing QR Code Container */}
            <div style={{
              background: '#ffffff',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              alignSelf: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
            }}>
              <QRCodeSVG 
                value={`${window.location.origin}/remote-scanner?channel=${channelId}`} 
                size={180}
                level="M"
              />
            </div>

            {/* Status block inside Modal */}
            <div style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: remoteConnected ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
              color: remoteConnected ? 'var(--success)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              {remoteConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              <span>
                {remoteConnected ? '✓ Phone Connected! Ready to scan.' : 'Waiting for connection...'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%' }}
                onClick={() => {
                  setRemoteConnected(false);
                  addLog('Remote scanner connection reset.', 'info');
                }}
                disabled={!remoteConnected}
              >
                Disconnect Phone
              </button>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => setShowRemoteModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function CameraError({ msg }) {
  return (
    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }}/><span>{msg}</span>
    </div>
  );
}
function BookCard({ book }) {
  return (
    <div style={{ background: 'rgba(0,242,254,0.04)', border: '1px solid rgba(0,242,254,0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', gap: '1rem' }}>
      <div style={{ width: '54px', height: '76px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
        {book.coverImage ? <img src={book.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <BookOpen size={22} color="var(--text-muted)"/>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden', flex: 1 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by {book.author}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ISBN: {book.isbn}</span>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', background: book.availableCopies>0?'var(--success-bg)':'var(--danger-bg)', color: book.availableCopies>0?'var(--success)':'var(--danger)' }}>
            {book.availableCopies>0?`${book.availableCopies} Available`:'Out of Stock'}
          </span>
          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>📍 {book.location||'Rack A1'}</span>
        </div>
      </div>
    </div>
  );
}
function StudentCard({ user }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(20,20,35,0.95),rgba(30,45,25,0.95))', border: '1px solid rgba(162,203,139,0.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(162,203,139,0.2) 0%,transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }}/>
      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#5c8a4a,#3d6b2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'white', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
        {user.name?.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{user.name}</span>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(162,203,139,0.2)', color: '#a2cb8b', border: '1px solid rgba(162,203,139,0.3)', textTransform: 'capitalize' }}>{user.role}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>ID: <strong style={{ color: '#c7eabb', fontFamily: 'monospace' }}>{user.studentId||'N/A'}</strong></span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Dept: <strong style={{ color: '#c7eabb' }}>{user.department||'—'}</strong></span>
        </div>
        {user.pendingFines > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>⚠ Fine: ₹{user.pendingFines}</span>}
      </div>
    </div>
  );
}
function ResultBanner({ ok, msg }) {
  return (
    <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center', background: ok?'var(--success-bg)':'var(--danger-bg)', border: `1px solid ${ok?'var(--success)':'var(--danger)'}`, color: ok?'var(--success)':'var(--danger)' }}>
      {ok ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}<span>{msg}</span>
    </div>
  );
}
