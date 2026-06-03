const mongoose = require('mongoose');

const entryLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['entry', 'exit'], required: true },
  timestamp: { type: Date, default: Date.now },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  method: { type: String, enum: ['qr', 'barcode', 'manual'], default: 'qr' },
  notes: { type: String },
}, { timestamps: true });

entryLogSchema.index({ user: 1, timestamp: -1 });
entryLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('EntryLog', entryLogSchema);
