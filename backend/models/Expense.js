import mongoose from 'mongoose';

const splitItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Split amount cannot be negative'],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Please provide an expense description'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0.01, 'Amount must be greater than zero'],
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
    convertedAmount: {
      type: Number,
      min: [0.01, 'Converted amount must be greater than zero'],
    },
    category: {
      type: String,
      enum: {
        values: [
          'food',
          'transport',
          'accommodation',
          'shopping',
          'entertainment',
          'utilities',
          'medical',
          'other',
        ],
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer is required'],
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    splitType: {
      type: String,
      enum: {
        values: ['equal', 'exact', 'percentage'],
        message: '{VALUE} is not a valid split type',
      },
      default: 'equal',
    },
    splits: {
      type: [splitItemSchema],
      validate: {
        validator: function (splits) {
          return splits && splits.length > 0;
        },
        message: 'An expense must have at least one split participant',
      },
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// If convertedAmount is not set, default to original amount
expenseSchema.pre('validate', function (next) {
  if (this.convertedAmount === undefined || this.convertedAmount === null) {
    this.convertedAmount = this.amount;
  }
  next();
});

// Indexes for faster lookups
expenseSchema.index({ group: 1, date: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'splits.user': 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ createdAt: -1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

export default Expense;
