const QuestionPaper = require('../models/QuestionPaper');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatGroq } = require('@langchain/groq');
const { HumanMessage } = require('@langchain/core/messages');
const pdf = require('pdf-parse');

class QuestionPaperService {
  constructor() {
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
        maxTokens: 8192,
      });
      this.provider = 'groq';
      console.log('✅ Groq AI model initialized (llama-3.3-70b)');
    } else if (geminiKey) {
      this.model = new ChatGoogleGenerativeAI({
        apiKey: geminiKey,
        modelName: 'gemini-2.0-flash',
        maxOutputTokens: 8192,
        temperature: 0.7,
      });
      this.provider = 'gemini';
      console.log('✅ Gemini AI model initialized');
    } else {
      console.warn('⚠️ No AI API key set. Set GROQ_API_KEY (free) or GOOGLE_GEMINI_API_KEY');
    }
  }

  async extractTextFromPDF(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  buildPrompt(config) {
    const { 
      subject, 
      topic, 
      className,
      questionTypes, 
      totalMarks,
      difficulty,
      referenceText,
      examType,
      duration
    } = config;

    let prompt = `You are an expert educational question paper generator. Generate a well-structured question paper with the following specifications:

**Subject:** ${subject}
**Class/Grade:** ${className || 'Not specified'}
**Topic/Chapter:** ${topic || 'General'}
**Exam Type:** ${examType || 'Practice Test'}
**Duration:** ${duration || 60} minutes
**Total Marks:** ${totalMarks}
**Difficulty Level:** ${difficulty || 'Mixed'}

**Question Distribution:**
`;

    questionTypes.forEach(qt => {
      prompt += `- ${qt.count} ${qt.type.replace('_', ' ')} questions of ${qt.marksEach} marks each (Total: ${qt.count * qt.marksEach} marks)\n`;
    });

    if (referenceText) {
      prompt += `\n**Reference Material (Previous Year Paper):**\n${referenceText.substring(0, 4000)}\n\nGenerate similar style questions based on the reference material above.\n`;
    }

    prompt += `
**Output Format:**
Generate the question paper in the following JSON format:
{
  "title": "Question paper title",
  "instructions": ["instruction 1", "instruction 2"],
  "sections": [
    {
      "sectionName": "Section A - MCQ",
      "instructions": "Choose the correct option",
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "Question text here?",
          "questionType": "mcq",
          "marks": 1,
          "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
          "correctAnswer": "A",
          "difficulty": "easy"
        }
      ]
    }
  ]
}

**Guidelines:**
1. Questions should be clear, unambiguous, and age-appropriate
2. Include a variety of difficulty levels as specified
3. For MCQs, provide 4 options with one correct answer
4. For short/long answer questions, provide marking scheme hints
5. Questions should test understanding, not just memorization
6. Include application-based and analytical questions
7. Ensure proper grammar and formatting

Generate the complete question paper now:`;

    return prompt;
  }

  async generateQuestionPaper(config, userId, institutionId) {
    if (!this.model) {
      throw new Error('AI model not initialized. Set GROQ_API_KEY (free) or GOOGLE_GEMINI_API_KEY in .env');
    }

    const prompt = this.buildPrompt(config);
    
    try {
      const response = await this.model.invoke([new HumanMessage(prompt)]);
      let content = response.content;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }
      
      const generatedPaper = JSON.parse(jsonMatch[0]);
      
      // Normalize questionType values to match enum
      const questionTypeMap = {
        'longAnswer': 'long_answer',
        'long_answer': 'long_answer',
        'shortAnswer': 'short_answer',
        'short_answer': 'short_answer',
        'fillBlank': 'fill_blank',
        'fill_blank': 'fill_blank',
        'fillInTheBlank': 'fill_blank',
        'trueFalse': 'true_false',
        'true_false': 'true_false',
        'mcq': 'mcq',
        'MCQ': 'mcq',
        'match': 'match',
        'matching': 'match'
      };

      // Calculate total marks and normalize question types
      let calculatedMarks = 0;
      generatedPaper.sections?.forEach(section => {
        section.questions?.forEach(q => {
          calculatedMarks += q.marks || 0;
          // Normalize questionType
          if (q.questionType && questionTypeMap[q.questionType]) {
            q.questionType = questionTypeMap[q.questionType];
          } else if (q.questionType) {
            // Default to short_answer if unknown type
            q.questionType = 'short_answer';
          }
        });
      });

      // Create question paper document
      const questionPaper = new QuestionPaper({
        title: generatedPaper.title || `${config.subject} - ${config.examType || 'Practice'} Paper`,
        subject: config.subjectId,
        subjectName: config.subject,
        class: config.classId,
        className: config.className,
        institution: institutionId,
        createdBy: userId,
        examType: config.examType || 'practice',
        duration: config.duration || 60,
        totalMarks: calculatedMarks || config.totalMarks,
        instructions: generatedPaper.instructions || [],
        sections: generatedPaper.sections || [],
        topic: config.topic,
        difficulty: config.difficulty || 'mixed',
        referenceDocument: config.referenceText ? {
          fileName: config.referenceFileName,
          extractedText: config.referenceText.substring(0, 5000)
        } : undefined,
        generationConfig: {
          questionTypes: config.questionTypes,
          totalQuestions: config.questionTypes.reduce((sum, qt) => sum + qt.count, 0),
          aiModel: this.provider || 'unknown',
          prompt: prompt.substring(0, 1000)
        },
        status: 'draft'
      });

      await questionPaper.save();
      return questionPaper;
    } catch (error) {
      console.error('Question generation error:', error);
      throw new Error('Failed to generate question paper: ' + error.message);
    }
  }

  async regenerateQuestionPaper(id, userId, institutionId) {
    const existingPaper = await QuestionPaper.findOne({ 
      _id: id, 
      institution: institutionId 
    });
    
    if (!existingPaper) {
      throw new Error('Question paper not found');
    }

    const config = {
      subject: existingPaper.subjectName,
      subjectId: existingPaper.subject,
      className: existingPaper.className,
      classId: existingPaper.class,
      topic: existingPaper.topic,
      questionTypes: existingPaper.generationConfig?.questionTypes || [],
      totalMarks: existingPaper.totalMarks,
      difficulty: existingPaper.difficulty,
      examType: existingPaper.examType,
      duration: existingPaper.duration,
      referenceText: existingPaper.referenceDocument?.extractedText,
      referenceFileName: existingPaper.referenceDocument?.fileName
    };

    // Generate new paper
    const newPaper = await this.generateQuestionPaper(config, userId, institutionId);
    
    // Optionally delete old paper or keep history
    return newPaper;
  }

  async getQuestionPapers(institutionId, filters = {}) {
    const query = { institution: institutionId };
    
    if (filters.subject) query.subject = filters.subject;
    if (filters.class) query.class = filters.class;
    if (filters.status) query.status = filters.status;
    if (filters.createdBy) query.createdBy = filters.createdBy;
    if (filters.examType) query.examType = filters.examType;

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [papers, total] = await Promise.all([
      QuestionPaper.find(query)
        .populate('subject', 'name')
        .populate('class', 'name')
        .populate('createdBy', 'firstName lastName name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QuestionPaper.countDocuments(query)
    ]);

    return {
      papers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getQuestionPaperById(id, institutionId) {
    return QuestionPaper.findOne({ _id: id, institution: institutionId })
      .populate('subject', 'name')
      .populate('class', 'name')
      .populate('createdBy', 'firstName lastName name');
  }

  async updateQuestionPaper(id, updateData, institutionId) {
    return QuestionPaper.findOneAndUpdate(
      { _id: id, institution: institutionId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteQuestionPaper(id, institutionId) {
    return QuestionPaper.findOneAndDelete({ _id: id, institution: institutionId });
  }
}

module.exports = new QuestionPaperService();
