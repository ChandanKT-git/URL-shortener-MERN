import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    shortcode: { type: String, required: true, unique: true, index: true },
    originalUrl: { type: String, required: true },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Url', urlSchema);
