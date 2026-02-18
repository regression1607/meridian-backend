const mongoose = require('mongoose');

// Book Schema
const bookSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['textbook', 'reference', 'fiction', 'non_fiction', 'magazine', 'journal', 'newspaper', 'other'],
    default: 'other'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  publisher: String,
  publicationYear: Number,
  edition: String,
  language: {
    type: String,
    default: 'English'
  },
  pages: Number,
  shelfLocation: String,
  bookCode: {
    type: String,
    required: true
  },
  totalCopies: {
    type: Number,
    default: 1
  },
  availableCopies: {
    type: Number,
    default: 1
  },
  price: {
    type: Number,
    default: 0
  },
  description: String,
  coverImage: String,
  tags: [String],
  status: {
    type: String,
    enum: ['available', 'all_issued', 'damaged', 'lost'],
    default: 'available'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Book Issue Schema
const bookIssueSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  issuedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: Date,
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue', 'lost', 'damaged'],
    default: 'issued'
  },
  renewCount: {
    type: Number,
    default: 0
  },
  maxRenewals: {
    type: Number,
    default: 2
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  remarks: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Library Settings Schema (per institution)
const librarySettingsSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    unique: true
  },
  maxBooksPerStudent: {
    type: Number,
    default: 3
  },
  maxBooksPerTeacher: {
    type: Number,
    default: 5
  },
  issueDurationStudent: {
    type: Number,
    default: 14
  },
  issueDurationTeacher: {
    type: Number,
    default: 30
  },
  finePerDay: {
    type: Number,
    default: 1
  },
  maxFineAmount: {
    type: Number,
    default: 100
  },
  allowRenewal: {
    type: Boolean,
    default: true
  },
  maxRenewals: {
    type: Number,
    default: 2
  }
}, { timestamps: true });

// Book Request Schema (for students to request books)
const bookRequestSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'issued', 'cancelled'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  rejectionReason: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes
bookSchema.index({ institution: 1, bookCode: 1 }, { unique: true });
bookSchema.index({ institution: 1, title: 'text', author: 'text' });
bookIssueSchema.index({ institution: 1, issuedTo: 1, status: 1 });
bookIssueSchema.index({ institution: 1, book: 1, status: 1 });
bookRequestSchema.index({ institution: 1, requestedBy: 1, status: 1 });
bookRequestSchema.index({ institution: 1, book: 1, status: 1 });

const Book = mongoose.model('Book', bookSchema);
const BookIssue = mongoose.model('BookIssue', bookIssueSchema);
const LibrarySettings = mongoose.model('LibrarySettings', librarySettingsSchema);
const BookRequest = mongoose.model('BookRequest', bookRequestSchema);

module.exports = { Book, BookIssue, LibrarySettings, BookRequest };
