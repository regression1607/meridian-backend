const libraryService = require('../services/library.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const getInstitutionId = (req) => {
  return req.user?.institution || req.query.institutionId || req.body.institutionId;
};

const libraryController = {
  // ============ BOOK CONTROLLERS ============
  createBook: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const book = await libraryService.createBook(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Book added successfully', book));
  }),

  getBooks: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await libraryService.getBooks(institutionId, req.query);
    res.json(ApiResponse.paginated('Books fetched successfully', result.books, result.pagination));
  }),

  getBookById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const book = await libraryService.getBookById(req.params.id, institutionId);
    res.json(ApiResponse.success('Book fetched successfully', book));
  }),

  updateBook: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const book = await libraryService.updateBook(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Book updated successfully', book));
  }),

  deleteBook: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await libraryService.deleteBook(req.params.id, institutionId);
    res.json(ApiResponse.success('Book deleted successfully', null));
  }),

  // ============ BOOK ISSUE CONTROLLERS ============
  issueBook: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const issue = await libraryService.issueBook(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Book issued successfully', issue));
  }),

  returnBook: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const { remarks } = req.body;
    const issue = await libraryService.returnBook(req.params.id, institutionId, req.user._id, remarks);
    res.json(ApiResponse.success('Book returned successfully', issue));
  }),

  renewBook: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const issue = await libraryService.renewBook(req.params.id, institutionId);
    res.json(ApiResponse.success('Book renewed successfully', issue));
  }),

  getIssuedBooks: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await libraryService.getIssuedBooks(institutionId, req.query);
    res.json(ApiResponse.paginated('Issued books fetched successfully', result.issues, result.pagination));
  }),

  markAsLost: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const issue = await libraryService.markAsLost(req.params.id, institutionId);
    res.json(ApiResponse.success('Book marked as lost', issue));
  }),

  // ============ SETTINGS CONTROLLERS ============
  getSettings: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const settings = await libraryService.getSettings(institutionId);
    res.json(ApiResponse.success('Settings fetched successfully', settings));
  }),

  updateSettings: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const settings = await libraryService.updateSettings(institutionId, req.body);
    res.json(ApiResponse.success('Settings updated successfully', settings));
  }),

  // ============ STATS ============
  getStats: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const stats = await libraryService.getLibraryStats(institutionId);
    res.json(ApiResponse.success('Library stats fetched successfully', stats));
  }),

  // ============ BOOK REQUEST CONTROLLERS ============
  createBookRequest: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const { bookId, reason } = req.body;
    const request = await libraryService.createBookRequest(institutionId, bookId, req.user._id, reason);
    res.status(201).json(ApiResponse.success('Book request submitted successfully', request));
  }),

  getMyBookRequests: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const requests = await libraryService.getMyBookRequests(institutionId, req.user._id);
    res.json(ApiResponse.success('Your book requests fetched successfully', requests));
  }),

  getBookRequests: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await libraryService.getBookRequests(institutionId, req.query);
    res.json(ApiResponse.paginated('Book requests fetched successfully', result.requests, result.pagination));
  }),

  approveBookRequest: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const request = await libraryService.approveBookRequest(req.params.id, institutionId, req.user._id);
    res.json(ApiResponse.success('Book request approved', request));
  }),

  rejectBookRequest: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const { reason } = req.body;
    const request = await libraryService.rejectBookRequest(req.params.id, institutionId, req.user._id, reason);
    res.json(ApiResponse.success('Book request rejected', request));
  })
};

module.exports = libraryController;
