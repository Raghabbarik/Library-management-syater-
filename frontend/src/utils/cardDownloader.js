/**
 * Utility to generate and download a premium digital library card as a PNG image.
 * Uses HTML5 Canvas to render the card pixel-perfectly with custom logo, institution name,
 * user details, and user's base64 QR code.
 */
export const downloadLibraryCard = (userData, settings) => {
  if (!userData) return;

  const canvas = document.createElement('canvas');
  // 1.58 aspect ratio for standard cards (600 x 380)
  canvas.width = 600;
  canvas.height = 380;
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#141423');
  grad.addColorStop(1, '#23143c');
  ctx.fillStyle = grad;
  
  // Rounded corners background
  const r = 24; // corner radius
  const w = canvas.width;
  const h = canvas.height;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Draw decorator glow blob
  ctx.beginPath();
  const blobGrad = ctx.createRadialGradient(500, 80, 10, 500, 80, 120);
  blobGrad.addColorStop(0, 'rgba(162, 203, 139, 0.15)');
  blobGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = blobGrad;
  ctx.arc(500, 80, 120, 0, Math.PI * 2);
  ctx.fill();

  // Draw Status Badge
  const isActive = userData.isActive !== false; // default to true if undefined
  const activeColor = isActive ? '#c7eabb' : '#f87171';
  const activeBg = isActive ? 'rgba(199, 234, 187, 0.2)' : 'rgba(239, 68, 68, 0.2)';
  const activeText = isActive ? 'ACTIVE' : 'INACTIVE';

  ctx.fillStyle = activeBg;
  // Rounded rect for badge
  const bx = 480, by = 30, bw = 90, bh = 26, br = 6;
  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
  ctx.lineTo(bx + bw, by + bh - br);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
  ctx.lineTo(bx + br, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
  ctx.lineTo(bx, by + br);
  ctx.quadraticCurveTo(bx, by, bx + br, by);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = isActive ? 'rgba(199, 234, 187, 0.3)' : 'rgba(239, 68, 68, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = activeColor;
  ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(activeText, bx + bw / 2, by + 17);
  ctx.textAlign = 'left'; // Reset

  // Helper to load image as promise
  const loadImage = (src) => {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  // Promise-based image drawing
  Promise.all([
    loadImage(userData.qrCode),
    loadImage(settings?.logo)
  ]).then(([qrImg, logoImg]) => {
    // 1. Draw Institution Logo & Header Title
    if (logoImg) {
      ctx.drawImage(logoImg, 30, 25, 42, 42);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(30, 25, 42, 42);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LOGO', 51, 50);
      ctx.textAlign = 'left'; // Reset
    }

    const startX = 85;
    ctx.fillStyle = '#c7eabb';
    ctx.font = 'bold 10px monospace';
    const cardTitle = settings?.institutionName 
      ? `${settings.institutionName.toUpperCase()} MEMBER PASS` 
      : 'SMART LIBRARY MEMBER PASS';
    ctx.fillText(cardTitle, startX, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, Helvetica, sans-serif';
    ctx.fillText('SmartLib Card', startX, 65);

    // 2. Draw QR Code
    if (qrImg) {
      ctx.drawImage(qrImg, 30, 110, 110, 110);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 110, 110, 110);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px Arial, sans-serif';
      ctx.fillText('NO QR CODE', 50, 165);
    }

    // 3. Draw User Details next to QR
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '9px Arial, Helvetica, sans-serif';
    ctx.fillText('CARD HOLDER', 170, 125);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
    ctx.fillText(userData.name || 'N/A', 170, 147);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '9px Arial, Helvetica, sans-serif';
    ctx.fillText('MEMBER ID', 170, 175);

    ctx.fillStyle = '#e8f5bd';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(userData.studentId || 'N/A', 170, 195);

    // Bottom Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 255);
    ctx.lineTo(570, 255);
    ctx.stroke();

    // Footer details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial, Helvetica, sans-serif';
    const deptStr = `DEP: ${userData.department || 'General'}`;
    const yearStr = userData.year ? ` | YEAR: ${userData.year}` : '';
    ctx.fillText(`${deptStr}${yearStr}`, 30, 285);

    const expiryStr = userData.membershipExpiry 
      ? new Date(userData.membershipExpiry).toLocaleDateString('en-IN') 
      : 'Never';
    ctx.fillText(`EXPIRES: ${expiryStr}`, 30, 310);

    // Trigger download
    const link = document.createElement('a');
    link.download = `library_card_${userData.studentId || userData.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
};
