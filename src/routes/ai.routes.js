const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, aiController.createChat);
router.get('/chats', protect, aiController.getChats);
router.get('/chats/:id', protect, aiController.getChatById);
router.post('/chats/:id/message', protect, aiController.sendMessage);
router.post('/quick-ask', protect, aiController.quickAsk);
router.delete('/chats/:id', protect, aiController.deleteChat);
router.delete('/history', protect, aiController.clearHistory);

module.exports = router;
