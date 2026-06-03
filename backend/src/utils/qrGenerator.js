const QRCode = require('qrcode');

/**
 * Generates a QR code as a base64 data URL string.
 * @param {string} data - The data to encode in the QR code.
 * @returns {Promise<string>} - Base64 data URL
 */
const generateQRCode = async (data) => {
  try {
    const qr = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
      width: 300,
    });
    return qr;
  } catch (error) {
    throw new Error(`QR generation failed: ${error.message}`);
  }
};

module.exports = { generateQRCode };
