import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    avatar: {
      type: String,
      default: function () {
        const encodedName = encodeURIComponent(this.name || 'User');
        return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}&backgroundColor=0284c7,0d9488,16a34a,e11d48,d97706`;
      },
    },
    defaultCurrency: {
      type: String,
      default: 'INR',
      uppercase: true,
      enum: {
        values: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'],
        message: '{VALUE} is not a supported currency',
      },
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Clean object representation
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
