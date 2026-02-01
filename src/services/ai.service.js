const AIChat = require('../models/AIChat');
const User = require('../models/User');
const { Class } = require('../models/Class');
const Attendance = require('../models/Attendance');
const { FeePayment } = require('../models/Fee');
const Event = require('../models/Event');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatGroq } = require('@langchain/groq');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');

class AIService {
  constructor() {
    this.systemPrompt = `You are an AI assistant for Meridian EMS (Education Management System). 
You help school administrators, teachers, and staff with:
- Student information and management
- Attendance tracking and reports
- Fee collection and payments
- Academic performance analysis
- Event management
- General school operations

Be helpful, concise, and professional. If you don't have specific data, provide general guidance.
When users ask about specific data, use the context provided to give accurate answers.
Format your responses with markdown for better readability.
Keep responses concise but informative.`;

    this.model = null;
    this.provider = null;
    this.initModel();
  }

  initModel() {
    // Try Groq first (free tier), then Gemini as fallback
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (groqKey) {
      this.model = new ChatGroq({
        apiKey: groqKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        maxTokens: 2048,
      });
      this.provider = 'groq';
      console.log('✅ Groq AI model initialized for AI Service (llama-3.3-70b)');
    } else if (geminiKey) {
      this.model = new ChatGoogleGenerativeAI({
        apiKey: geminiKey,
        modelName: 'gemini-2.0-flash',
        maxOutputTokens: 2048,
        temperature: 0.7,
      });
      this.provider = 'gemini';
      console.log('✅ Gemini AI model initialized for AI Service');
    } else {
      console.warn('⚠️ No AI API key set - AI will use fallback responses');
    }
  }

  async createChat(userId, institutionId, initialMessage) {
    const chat = new AIChat({
      user: userId,
      institutionId,
      title: initialMessage?.substring(0, 50) || 'New Chat',
      messages: [{
        role: 'system',
        content: this.systemPrompt
      }]
    });

    if (initialMessage) {
      chat.messages.push({
        role: 'user',
        content: initialMessage
      });

      const response = await this.generateResponse(chat, institutionId);
      chat.messages.push({
        role: 'assistant',
        content: response
      });
    }

    await chat.save();
    return chat;
  }

  async getChats(userId, limit = 20) {
    return AIChat.find({ user: userId, isActive: true })
      .select('title context createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(limit);
  }

  async getChatById(chatId, userId) {
    const chat = await AIChat.findOne({ _id: chatId, user: userId });
    if (!chat) throw new ApiError(404, 'Chat not found');
    return chat;
  }

  async sendMessage(chatId, userId, institutionId, message) {
    const chat = await AIChat.findOne({ _id: chatId, user: userId });
    if (!chat) throw new ApiError(404, 'Chat not found');

    chat.messages.push({
      role: 'user',
      content: message
    });

    const response = await this.generateResponse(chat, institutionId);
    chat.messages.push({
      role: 'assistant',
      content: response
    });

    chat.updatedAt = new Date();
    await chat.save();

    return {
      userMessage: message,
      assistantMessage: response
    };
  }

  async generateResponse(chat, institutionId) {
    const lastUserMessage = chat.messages.filter(m => m.role === 'user').pop()?.content || '';
    const lowerMessage = lastUserMessage.toLowerCase();

    // Detect intent and gather context
    let context = {};
    let responseType = 'general';

    try {
      if (this.matchesIntent(lowerMessage, ['student', 'students', 'enrollment', 'admitted'])) {
        context = await this.getStudentContext(institutionId);
        responseType = 'students';
      } else if (this.matchesIntent(lowerMessage, ['attendance', 'present', 'absent', 'leave'])) {
        context = await this.getAttendanceContext(institutionId);
        responseType = 'attendance';
      } else if (this.matchesIntent(lowerMessage, ['fee', 'fees', 'payment', 'due', 'collection', 'pending'])) {
        context = await this.getFeeContext(institutionId);
        responseType = 'fees';
      } else if (this.matchesIntent(lowerMessage, ['event', 'events', 'upcoming', 'schedule', 'calendar'])) {
        context = await this.getEventContext(institutionId);
        responseType = 'events';
      } else if (this.matchesIntent(lowerMessage, ['teacher', 'teachers', 'staff', 'faculty'])) {
        context = await this.getStaffContext(institutionId);
        responseType = 'staff';
      } else if (this.matchesIntent(lowerMessage, ['class', 'classes', 'section', 'sections'])) {
        context = await this.getClassContext(institutionId);
        responseType = 'classes';
      }
    } catch (err) {
      console.error('Error gathering context:', err);
    }

    // Use Gemini AI if available
    if (this.model) {
      try {
        return await this.generateWithGemini(chat, lastUserMessage, responseType, context);
      } catch (err) {
        console.error('Gemini AI error:', err);
        // Fall back to built-in responses
      }
    }

    return this.buildResponse(lastUserMessage, responseType, context);
  }

  async generateWithGemini(chat, userMessage, responseType, context) {
    // Build context message for the AI
    let contextMessage = '';
    if (Object.keys(context).length > 0) {
      contextMessage = `\n\nHere is the current data from the school database:\n${JSON.stringify(context, null, 2)}`;
    }

    // Convert chat history to LangChain messages
    const messages = [
      new SystemMessage(this.systemPrompt + contextMessage)
    ];

    // Add recent conversation history (last 10 messages)
    const recentMessages = chat.messages.filter(m => m.role !== 'system').slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // Get response from Gemini
    const response = await this.model.invoke(messages);
    return response.content;
  }

  matchesIntent(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
  }

  async getStudentContext(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const [total, byGender, newThisMonth] = await Promise.all([
      User.countDocuments({ institution: instId, role: 'student', isActive: true }),
      User.aggregate([
        { $match: { institution: instId, role: 'student', isActive: true } },
        { $group: { _id: '$profile.gender', count: { $sum: 1 } } }
      ]),
      User.countDocuments({
        institution: instId,
        role: 'student',
        isActive: true,
        createdAt: { $gte: new Date(new Date().setDate(1)) }
      })
    ]);

    const genderData = byGender.reduce((acc, g) => {
      acc[g._id || 'unknown'] = g.count;
      return acc;
    }, {});

    return { total, male: genderData.male || 0, female: genderData.female || 0, newThisMonth };
  }

  async getAttendanceContext(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.aggregate([
      { $match: { institutionId: instId, date: { $gte: today } } },
      { $unwind: '$records' },
      { $group: { _id: '$records.status', count: { $sum: 1 } } }
    ]);

    const summary = todayAttendance.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    const percentage = total ? ((summary.present || 0) / total * 100).toFixed(1) : 0;

    return { present: summary.present || 0, absent: summary.absent || 0, late: summary.late || 0, percentage, total };
  }

  async getFeeContext(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [collected, pending] = await Promise.all([
      FeePayment.aggregate([
        { $match: { institutionId: instId, status: 'completed', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: { institutionId: instId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    return {
      collectedThisMonth: collected[0]?.total || 0,
      collectedCount: collected[0]?.count || 0,
      pendingAmount: pending[0]?.total || 0,
      pendingCount: pending[0]?.count || 0
    };
  }

  async getEventContext(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const upcoming = await Event.find({
      institutionId: instId,
      startDate: { $gte: new Date() },
      status: 'published'
    }).sort({ startDate: 1 }).limit(5);

    return {
      upcomingCount: upcoming.length,
      events: upcoming.map(e => ({ title: e.title, date: e.startDate, type: e.type }))
    };
  }

  async getStaffContext(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const [teachers, staff, coordinators] = await Promise.all([
      User.countDocuments({ institution: instId, role: 'teacher', isActive: true }),
      User.countDocuments({ institution: instId, role: 'staff', isActive: true }),
      User.countDocuments({ institution: instId, role: 'coordinator', isActive: true })
    ]);

    return { teachers, staff, coordinators, total: teachers + staff + coordinators };
  }

  async getClassContext(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const classes = await Class.find({ institution: instId, isActive: true })
      .select('name sections')
      .populate('sections', 'name');

    return {
      totalClasses: classes.length,
      classes: classes.map(c => ({ name: c.name, sections: c.sections?.length || 0 }))
    };
  }

  buildResponse(question, type, context) {
    const lowerQ = question.toLowerCase();

    switch (type) {
      case 'students':
        if (lowerQ.includes('how many') || lowerQ.includes('total') || lowerQ.includes('count')) {
          return `📊 **Student Statistics:**\n\n` +
            `- **Total Students:** ${context.total}\n` +
            `- **Male:** ${context.male}\n` +
            `- **Female:** ${context.female}\n` +
            `- **New This Month:** ${context.newThisMonth}\n\n` +
            `Is there anything specific about students you'd like to know?`;
        }
        return `I can help you with student information. Currently, you have **${context.total} students** enrolled.\n\nYou can ask me about:\n- Total student count\n- Gender distribution\n- New admissions\n- Student details`;

      case 'attendance':
        return `📅 **Today's Attendance Summary:**\n\n` +
          `- **Present:** ${context.present} students\n` +
          `- **Absent:** ${context.absent} students\n` +
          `- **Late:** ${context.late} students\n` +
          `- **Attendance Rate:** ${context.percentage}%\n\n` +
          `Would you like more details about attendance patterns or specific class attendance?`;

      case 'fees':
        return `💰 **Fee Collection Summary:**\n\n` +
          `**This Month:**\n` +
          `- Collected: ₹${context.collectedThisMonth.toLocaleString()} (${context.collectedCount} payments)\n\n` +
          `**Pending:**\n` +
          `- Amount: ₹${context.pendingAmount.toLocaleString()} (${context.pendingCount} students)\n\n` +
          `Need help with fee reminders or detailed reports?`;

      case 'events':
        if (context.upcomingCount === 0) {
          return `📆 There are no upcoming events scheduled at the moment.\n\nWould you like to create a new event?`;
        }
        let eventList = context.events.map(e => 
          `- **${e.title}** (${e.type}) - ${new Date(e.date).toLocaleDateString()}`
        ).join('\n');
        return `📆 **Upcoming Events (${context.upcomingCount}):**\n\n${eventList}\n\nNeed more details about any event?`;

      case 'staff':
        return `👥 **Staff Overview:**\n\n` +
          `- **Teachers:** ${context.teachers}\n` +
          `- **Staff:** ${context.staff}\n` +
          `- **Coordinators:** ${context.coordinators}\n` +
          `- **Total:** ${context.total}\n\n` +
          `What else would you like to know about staff?`;

      case 'classes':
        let classList = context.classes.slice(0, 5).map(c => 
          `- **${c.name}** (${c.sections} sections)`
        ).join('\n');
        return `🏫 **Class Information:**\n\n` +
          `Total Classes: ${context.totalClasses}\n\n${classList}\n\n` +
          `Would you like details about a specific class?`;

      default:
        return this.getGeneralResponse(question);
    }
  }

  getGeneralResponse(question) {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('hello') || lowerQ.includes('hi') || lowerQ.includes('hey')) {
      return `Hello! 👋 I'm your AI assistant for Meridian EMS. I can help you with:\n\n` +
        `📊 **Students** - Enrollment, details, statistics\n` +
        `📅 **Attendance** - Today's status, reports, patterns\n` +
        `💰 **Fees** - Collections, pending, reminders\n` +
        `📆 **Events** - Upcoming events, calendar\n` +
        `👥 **Staff** - Teachers, coordinators\n` +
        `📈 **Reports** - Various analytics\n\n` +
        `What would you like to know?`;
    }

    if (lowerQ.includes('help') || lowerQ.includes('what can you do')) {
      return `I can assist you with various school management tasks:\n\n` +
        `**Ask me about:**\n` +
        `- "How many students do we have?"\n` +
        `- "Show today's attendance"\n` +
        `- "What's the fee collection this month?"\n` +
        `- "List upcoming events"\n` +
        `- "How many teachers are there?"\n` +
        `- "Show class information"\n\n` +
        `Just type your question naturally!`;
    }

    if (lowerQ.includes('thank')) {
      return `You're welcome! 😊 Feel free to ask if you need anything else.`;
    }

    return `I understand you're asking about "${question.substring(0, 50)}..."\n\n` +
      `I can help you with information about students, attendance, fees, events, staff, and classes. ` +
      `Could you please be more specific about what you'd like to know?\n\n` +
      `For example, try asking:\n` +
      `- "How many students are enrolled?"\n` +
      `- "What's today's attendance?"\n` +
      `- "Show pending fees"`;
  }

  async deleteChat(chatId, userId) {
    const chat = await AIChat.findOneAndUpdate(
      { _id: chatId, user: userId },
      { isActive: false },
      { new: true }
    );
    if (!chat) throw new ApiError(404, 'Chat not found');
    return { message: 'Chat deleted' };
  }

  async clearHistory(userId) {
    await AIChat.updateMany({ user: userId }, { isActive: false });
    return { message: 'Chat history cleared' };
  }
}

module.exports = new AIService();
