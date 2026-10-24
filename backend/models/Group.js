import mongoose from 'mongoose';

// Function to generate a random 6-character alphanumeric invite code
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluding ambiguous chars (O, 0, I, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: {
        values: ['trip', 'home', 'couple', 'other'],
        message: '{VALUE} is not a valid group type',
      },
      default: 'other',
    },
    members: {
      type: [memberSchema],
      validate: {
        validator: function (members) {
          return members && members.length > 0;
        },
        message: 'A group must have at least one member',
      },
    },
    inviteCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSettled: {
      type: Boolean,
      default: false,
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

// Ensure invite code is set before initial save
groupSchema.pre('validate', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = generateInviteCode();
  }
  next();
});

groupSchema.methods.isAdmin = function (userId) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  return member && member.role === 'admin';
};

groupSchema.methods.isMember = function (userId) {
  return this.members.some(
    (m) => m.user.toString() === userId.toString()
  );
};

// Database indexes for fast member lookups
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ createdBy: 1 });

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

export default Group;
