const { Book, BookIssue, LibrarySettings, BookRequest } = require('../models/Library');
const ApiError = require('../utils/apiError');

class LibraryService {
  // ============ BOOK METHODS ============
  async createBook(institutionId, bookData, userId) {
    const existing = await Book.findOne({
      institution: institutionId,
      bookCode: bookData.bookCode,
      isDeleted: false
    });

    if (existing) {
      throw new ApiError(400, 'Book with this code already exists');
    }

    // Remove empty strings for optional ObjectId fields
    const cleanedData = { ...bookData };
    if (!cleanedData.subject) delete cleanedData.subject;

    const book = new Book({
      ...cleanedData,
      institution: institutionId,
      addedBy: userId,
      availableCopies: cleanedData.totalCopies || 1
    });

    await book.save();
    return book;
  }

  async getBooks(institutionId, filters = {}) {
    const { category, status, search, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { bookCode: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      Book.find(query)
        .populate('subject', 'name')
        .populate('addedBy', 'profile.firstName profile.lastName')
        .sort({ title: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Book.countDocuments(query)
    ]);

    return {
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getBookById(bookId, institutionId) {
    const book = await Book.findOne({
      _id: bookId,
      institution: institutionId,
      isDeleted: false
    })
      .populate('subject', 'name')
      .populate('addedBy', 'profile.firstName profile.lastName');

    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    return book;
  }

  async updateBook(bookId, institutionId, updateData) {
    const book = await Book.findOneAndUpdate(
      { _id: bookId, institution: institutionId, isDeleted: false },
      updateData,
      { new: true }
    );

    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    // Update status based on available copies
    if (book.availableCopies === 0) {
      book.status = 'all_issued';
    } else if (book.status === 'all_issued' && book.availableCopies > 0) {
      book.status = 'available';
    }
    await book.save();

    return book;
  }

  async deleteBook(bookId, institutionId) {
    // Check if book has any active issues
    const activeIssues = await BookIssue.countDocuments({
      book: bookId,
      status: 'issued',
      isDeleted: false
    });

    if (activeIssues > 0) {
      throw new ApiError(400, 'Cannot delete book with active issues');
    }

    const book = await Book.findOneAndUpdate(
      { _id: bookId, institution: institutionId },
      { isDeleted: true },
      { new: true }
    );

    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    return book;
  }

  // ============ BOOK ISSUE METHODS ============
  async issueBook(institutionId, issueData, issuedBy) {
    const { bookId, issuedTo, dueDate } = issueData;

    // Check book availability
    const book = await Book.findOne({
      _id: bookId,
      institution: institutionId,
      isDeleted: false
    });

    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    if (book.availableCopies < 1) {
      throw new ApiError(400, 'No copies available for this book');
    }

    // Check user's current issues against limit
    const settings = await this.getSettings(institutionId);
    const User = require('../models/User');
    const user = await User.findById(issuedTo);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const maxBooks = user.role === 'student' ? settings.maxBooksPerStudent : settings.maxBooksPerTeacher;
    const currentIssues = await BookIssue.countDocuments({
      institution: institutionId,
      issuedTo,
      status: 'issued',
      isDeleted: false
    });

    if (currentIssues >= maxBooks) {
      throw new ApiError(400, `User has reached maximum book limit (${maxBooks})`);
    }

    // Check if user already has this book
    const alreadyIssued = await BookIssue.findOne({
      institution: institutionId,
      book: bookId,
      issuedTo,
      status: 'issued',
      isDeleted: false
    });

    if (alreadyIssued) {
      throw new ApiError(400, 'User already has this book issued');
    }

    // Calculate due date if not provided
    const issueDuration = user.role === 'student' ? settings.issueDurationStudent : settings.issueDurationTeacher;
    const calculatedDueDate = dueDate || new Date(Date.now() + issueDuration * 24 * 60 * 60 * 1000);

    const issue = new BookIssue({
      institution: institutionId,
      book: bookId,
      issuedTo,
      issuedBy,
      dueDate: calculatedDueDate,
      maxRenewals: settings.maxRenewals
    });

    await issue.save();

    // Update book available copies
    book.availableCopies -= 1;
    if (book.availableCopies === 0) {
      book.status = 'all_issued';
    }
    await book.save();

    return issue.populate(['book', 'issuedTo', 'issuedBy']);
  }

  async returnBook(issueId, institutionId, returnedBy, remarks) {
    const issue = await BookIssue.findOne({
      _id: issueId,
      institution: institutionId,
      status: 'issued',
      isDeleted: false
    });

    if (!issue) {
      throw new ApiError(404, 'Issue record not found or already returned');
    }

    // Calculate fine if overdue
    const settings = await this.getSettings(institutionId);
    const now = new Date();
    let fineAmount = 0;

    if (now > issue.dueDate) {
      const daysOverdue = Math.ceil((now - issue.dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = Math.min(daysOverdue * settings.finePerDay, settings.maxFineAmount);
    }

    issue.returnDate = now;
    issue.returnedTo = returnedBy;
    issue.status = 'returned';
    issue.fineAmount = fineAmount;
    issue.remarks = remarks;
    await issue.save();

    // Update book available copies
    const book = await Book.findById(issue.book);
    if (book) {
      book.availableCopies += 1;
      if (book.status === 'all_issued') {
        book.status = 'available';
      }
      await book.save();
    }

    return issue.populate(['book', 'issuedTo']);
  }

  async renewBook(issueId, institutionId) {
    const issue = await BookIssue.findOne({
      _id: issueId,
      institution: institutionId,
      status: 'issued',
      isDeleted: false
    });

    if (!issue) {
      throw new ApiError(404, 'Issue record not found');
    }

    if (issue.renewCount >= issue.maxRenewals) {
      throw new ApiError(400, 'Maximum renewals reached');
    }

    const settings = await this.getSettings(institutionId);
    const User = require('../models/User');
    const user = await User.findById(issue.issuedTo);
    const issueDuration = user?.role === 'student' ? settings.issueDurationStudent : settings.issueDurationTeacher;

    issue.dueDate = new Date(Date.now() + issueDuration * 24 * 60 * 60 * 1000);
    issue.renewCount += 1;
    await issue.save();

    return issue.populate(['book', 'issuedTo']);
  }

  async getIssuedBooks(institutionId, filters = {}) {
    const { status, userId, bookId, overdue, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (status) query.status = status;
    if (userId) query.issuedTo = userId;
    if (bookId) query.book = bookId;
    if (overdue === 'true') {
      query.status = 'issued';
      query.dueDate = { $lt: new Date() };
    }

    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      BookIssue.find(query)
        .populate('book', 'title author bookCode category')
        .populate('issuedTo', 'email profile role')
        .populate('issuedBy', 'profile.firstName profile.lastName')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BookIssue.countDocuments(query)
    ]);

    // Mark overdue items
    const now = new Date();
    const processedIssues = issues.map(issue => ({
      ...issue,
      isOverdue: issue.status === 'issued' && new Date(issue.dueDate) < now
    }));

    return {
      issues: processedIssues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async markAsLost(issueId, institutionId) {
    const issue = await BookIssue.findOne({
      _id: issueId,
      institution: institutionId,
      status: 'issued',
      isDeleted: false
    });

    if (!issue) {
      throw new ApiError(404, 'Issue record not found');
    }

    // Get book price for fine
    const book = await Book.findById(issue.book);
    issue.status = 'lost';
    issue.fineAmount = book?.price || 0;
    await issue.save();

    // Update book copies
    if (book) {
      book.totalCopies -= 1;
      await book.save();
    }

    return issue.populate(['book', 'issuedTo']);
  }

  // ============ SETTINGS METHODS ============
  async getSettings(institutionId) {
    let settings = await LibrarySettings.findOne({ institution: institutionId });
    
    if (!settings) {
      // Create default settings
      settings = new LibrarySettings({ institution: institutionId });
      await settings.save();
    }

    return settings;
  }

  async updateSettings(institutionId, settingsData) {
    const settings = await LibrarySettings.findOneAndUpdate(
      { institution: institutionId },
      settingsData,
      { new: true, upsert: true }
    );

    return settings;
  }

  // ============ STATS ============
  async getLibraryStats(institutionId) {
    const mongoose = require('mongoose');
    const now = new Date();
    
    // Convert to ObjectId for aggregation queries
    let instId;
    try {
      instId = new mongoose.Types.ObjectId(institutionId);
    } catch (e) {
      instId = institutionId;
    }

    const [
      totalBooks,
      copiesData,
      issuedCount,
      overdueCount,
      categories
    ] = await Promise.all([
      Book.countDocuments({ institution: institutionId, isDeleted: false }),
      Book.aggregate([
        { $match: { institution: instId, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }
      ]),
      BookIssue.countDocuments({ institution: institutionId, status: 'issued', isDeleted: false }),
      BookIssue.countDocuments({ 
        institution: institutionId, 
        status: 'issued', 
        dueDate: { $lt: now },
        isDeleted: false 
      }),
      Book.aggregate([
        { $match: { institution: instId, isDeleted: false } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalBooks,
      totalCopies: copiesData[0]?.total || 0,
      availableCopies: copiesData[0]?.available || 0,
      issuedCount,
      overdueCount,
      categories: categories.reduce((acc, cat) => {
        acc[cat._id] = cat.count;
        return acc;
      }, {})
    };
  }

  // ============ BOOK REQUEST METHODS ============
  async createBookRequest(institutionId, bookId, userId, reason) {
    // Check if book exists and has available copies
    const book = await Book.findOne({ _id: bookId, institution: institutionId, isDeleted: false });
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }
    if (book.availableCopies <= 0) {
      throw new ApiError(400, 'No copies available for this book');
    }

    // Check for existing pending request
    const existingRequest = await BookRequest.findOne({
      institution: institutionId,
      book: bookId,
      requestedBy: userId,
      status: 'pending',
      isDeleted: false
    });
    if (existingRequest) {
      throw new ApiError(400, 'You already have a pending request for this book');
    }

    const request = new BookRequest({
      institution: institutionId,
      book: bookId,
      requestedBy: userId,
      reason
    });

    await request.save();
    return request.populate(['book', 'requestedBy']);
  }

  async getMyBookRequests(institutionId, userId) {
    return BookRequest.find({
      institution: institutionId,
      requestedBy: userId,
      isDeleted: false
    })
      .populate('book', 'title author bookCode availableCopies')
      .sort({ createdAt: -1 });
  }

  async getBookRequests(institutionId, filters = {}) {
    const { status, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      BookRequest.find(query)
        .populate('book', 'title author bookCode')
        .populate('requestedBy', 'profile.firstName profile.lastName email')
        .populate('processedBy', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BookRequest.countDocuments(query)
    ]);

    return {
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async approveBookRequest(requestId, institutionId, userId) {
    const request = await BookRequest.findOne({
      _id: requestId,
      institution: institutionId,
      status: 'pending',
      isDeleted: false
    });

    if (!request) {
      throw new ApiError(404, 'Request not found or already processed');
    }

    request.status = 'approved';
    request.processedBy = userId;
    request.processedAt = new Date();
    await request.save();

    return request.populate(['book', 'requestedBy', 'processedBy']);
  }

  async rejectBookRequest(requestId, institutionId, userId, reason) {
    const request = await BookRequest.findOne({
      _id: requestId,
      institution: institutionId,
      status: 'pending',
      isDeleted: false
    });

    if (!request) {
      throw new ApiError(404, 'Request not found or already processed');
    }

    request.status = 'rejected';
    request.processedBy = userId;
    request.processedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    return request.populate(['book', 'requestedBy', 'processedBy']);
  }
}

module.exports = new LibraryService();
