import React, { useState } from 'react';
import axios from 'axios';
import { CreditCard, Smartphone, CheckCircle, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export default function PaymentGateway({ user, onPaymentSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState('Scholar Elite');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueData, setIssueData] = useState({ phone: '', email: user?.email || '' });
  const [issueReported, setIssueReported] = useState(false);

  const plans = {
    'Basic (Free)': 0,
    'Scholar Elite': 299,
    'Institutional Pro': 999
  };

  const amount = plans[selectedPlan];

  const handleSimulatePayment = async (forceFail = false) => {
    setIsProcessing(true);
    setPaymentError('');
    setShowIssueForm(false);
    
    // Simulate gateway delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (amount === 0) {
      // Free plan skips payment
      forceFail = false;
    }

    try {
      if (forceFail) {
        // Simulate a scenario where money is deducted but the API activation fails
        throw new Error('Server error: Could not activate subscription. Payment gateway transaction succeeded.');
      }

      // Call actual backend to activate
      const res = await axios.post('/api/payments/activate', {
        plan: selectedPlan.split(' ')[0].toLowerCase(), // basic, scholar, institutional
        amount,
        transactionId: `txn_mock_${Date.now()}`
      });

      if (res.data.success) {
        onPaymentSuccess(); // Triggers dashboard unlock
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || err.message || 'An unexpected error occurred during activation.');
      if (amount > 0) {
        setShowIssueForm(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await axios.post('/api/payments/issue', {
        email: issueData.email,
        phone: issueData.phone,
        planSelected: selectedPlan,
        amount,
        errorMessage: paymentError
      });
      setIssueReported(true);
    } catch (err) {
      alert('Failed to submit refund request. Please contact support directly.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (issueReported) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', padding: '2rem' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', maxWidth: '500px', textAlign: 'center' }}>
          <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.8rem', marginBottom: '1rem' }}>Refund Request Received</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            We sincerely apologize for the inconvenience. Your payment issue has been logged, and a refund of <strong>₹{amount}</strong> will be processed to your original payment method within <strong>5 working days</strong>.
          </p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '2rem', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <ShieldCheck size={48} style={{ color: 'var(--accent-cyan)', margin: '0 auto 1rem' }} />
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: '2.5rem', marginBottom: '0.5rem' }}>Subscription Required</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          Please select a plan and complete your payment to unlock the administrative dashboard and all features.
        </p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', overflow: 'hidden' }}>
        
        {/* Left Side: Plan Selection */}
        <div style={{ padding: '2.5rem', borderRight: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Select your plan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(plans).map(([name, price]) => (
              <label key={name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem', borderRadius: 'var(--radius-md)',
                border: selectedPlan === name ? '2px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                background: selectedPlan === name ? 'rgba(0, 242, 254, 0.05)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="radio" 
                    name="plan" 
                    checked={selectedPlan === name} 
                    onChange={() => setSelectedPlan(name)}
                    style={{ accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontWeight: selectedPlan === name ? 600 : 400 }}>{name}</span>
                </div>
                <span style={{ fontWeight: 700 }}>₹{price}</span>
              </label>
            ))}
          </div>
          
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px dashed var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>₹{amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 800 }}>
              <span>Total</span>
              <span className="text-gradient">₹{amount}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Details */}
        <div style={{ padding: '2.5rem' }}>
          {showIssueForm ? (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '1rem' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Activation Failed</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {paymentError} <br/><br/>
                If the amount of <strong>₹{amount}</strong> was deducted from your account, please provide your details below. We will refund the amount within <strong>5 working days</strong>.
              </p>
              <form onSubmit={handleReportIssue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Email Address</label>
                  <input type="email" value={issueData.email} onChange={e => setIssueData({...issueData, email: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Mobile Number</label>
                  <input type="tel" value={issueData.phone} onChange={e => setIssueData({...issueData, phone: e.target.value})} required placeholder="+91 98765 43210" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ marginTop: '0.5rem' }}>
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Submit Refund Request'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowIssueForm(false)} disabled={isProcessing}>
                  Cancel / Try Again
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Payment Method</h3>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                  className="btn"
                  onClick={() => setPaymentMethod('card')}
                  style={{ 
                    flex: 1, padding: '1rem', border: '1px solid var(--glass-border)',
                    background: paymentMethod === 'card' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: paymentMethod === 'card' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  <CreditCard size={24} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.8rem' }}>Card</div>
                </button>
                <button 
                  className="btn"
                  onClick={() => setPaymentMethod('upi')}
                  style={{ 
                    flex: 1, padding: '1rem', border: '1px solid var(--glass-border)',
                    background: paymentMethod === 'upi' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: paymentMethod === 'upi' ? 'var(--accent-purple)' : 'var(--text-secondary)'
                  }}
                >
                  <Smartphone size={24} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.8rem' }}>UPI</div>
                </button>
              </div>

              {amount > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  {paymentMethod === 'card' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <input type="text" placeholder="Card Number (Mock)" defaultValue="4111 1111 1111 1111" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input type="text" placeholder="MM/YY" defaultValue="12/25" />
                        <input type="text" placeholder="CVV" defaultValue="123" />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <input type="text" placeholder="UPI ID (Mock)" defaultValue="user@okaxis" />
                    </div>
                  )}
                </div>
              )}

              {paymentError && !showIssueForm && (
                <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {paymentError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleSimulatePayment(false)}
                  disabled={isProcessing}
                  style={{ padding: '0.85rem', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', border: 'none', color: '#000', fontWeight: 700 }}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : `Pay ₹${amount} & Activate`}
                </button>
                
                {amount > 0 && (
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleSimulatePayment(true)}
                    disabled={isProcessing}
                    style={{ padding: '0.65rem', fontSize: '0.8rem', opacity: 0.8 }}
                    title="Simulate a scenario where payment succeeds but server fails"
                  >
                    Force Activation Error (Test Refund Flow)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
