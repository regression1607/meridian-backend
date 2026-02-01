const aiService = require('../services/ai.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const aiController = {
  createChat: asyncHandler(async (req, res) => {
    const { message } = req.body;
    const chat = await aiService.createChat(req.user._id, req.user.institution, message);
    res.status(201).json(ApiResponse.success('Chat created', chat));
  }),

  getChats: asyncHandler(async (req, res) => {
    const chats = await aiService.getChats(req.user._id, req.query.limit);
    res.json(ApiResponse.success('Chats fetched', chats));
  }),

  getChatById: asyncHandler(async (req, res) => {
    const chat = await aiService.getChatById(req.params.id, req.user._id);
    res.json(ApiResponse.success('Chat fetched', chat));
  }),

  sendMessage: asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json(ApiResponse.error('Message is required'));
    }
    const response = await aiService.sendMessage(req.params.id, req.user._id, req.user.institution, message);
    res.json(ApiResponse.success('Message sent', response));
  }),

  quickAsk: asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json(ApiResponse.error('Message is required'));
    }
    const chat = await aiService.createChat(req.user._id, req.user.institution, message);
    const lastMessage = chat.messages[chat.messages.length - 1];
    res.json(ApiResponse.success('Response generated', {
      chatId: chat._id,
      response: lastMessage.content
    }));
  }),

  deleteChat: asyncHandler(async (req, res) => {
    await aiService.deleteChat(req.params.id, req.user._id);
    res.json(ApiResponse.success('Chat deleted', null));
  }),

  clearHistory: asyncHandler(async (req, res) => {
    await aiService.clearHistory(req.user._id);
    res.json(ApiResponse.success('History cleared', null));
  })
};

module.exports = aiController;
