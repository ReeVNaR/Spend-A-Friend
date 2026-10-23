import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer (from) is required'],
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient (to) is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Settlement amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      enum: {
        values: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'],
        message: '{VALUE} is not a supported currency',
      },
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
settlementSchema.index({ group: 1, date: -1 });
settlementSchema.index({ from: 1, to: 1 });

const Settlement = mongoose.models.Settlement || mongoose.model('Settlement', settlementSchema);

export default Settlement;
