import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import VisitorUser from '../models/VisitorUser.js';
import VisitorSession from '../models/VisitorSession.js';
import VisitorChatHistory from '../models/VisitorChatHistory.js';
import Chatbot from '../models/Chatbot.js';
import mongoose from 'mongoose';

// @desc    Initialize or retrieve visitor session
// @route   POST /api/v1/visitor/session
// @access  Public
export const initializeSession = asyncHandler(async (req, res, next) => {
    const { email, chatbotId } = req.body;

    if (!email || !chatbotId) {
        return next(new ErrorResponse('Please provide email and chatbotId', 400));
    }

    try {
        // Find or create visitor user
        let visitorUser = await VisitorUser.findOne({ email });
        if (!visitorUser) {
            visitorUser = await VisitorUser.create({
                email,
                metadata: {
                    browser: req.headers['user-agent'],
                    lastIp: req.ip
                }
            });
        } else {
            await visitorUser.updateLastLogin();
        }

        // Create new session
        const session = await VisitorSession.create({
            visitorUser: visitorUser._id,
            chatbot: chatbotId,
            sessionStartTime: new Date(),
            isActive: true
        });

        // Initialize chat history
        const chatHistory = await VisitorChatHistory.create({
            visitorSession: session._id,
            messages: []
        });

        // Update session with chat history reference
        session.chatHistory = chatHistory._id;
        await session.save();

        console.log('Created new session:', {
            session: session._id,
            user: visitorUser._id,
            chatHistory: chatHistory._id
        });

        res.status(200).json({
            success: true,
            data: {
                sessionId: session._id,
                userId: visitorUser._id,
                chatHistoryId: chatHistory._id
            }
        });
    } catch (error) {
        console.error('Error in initializeSession:', error);
        return next(new ErrorResponse('Error initializing session', 500));
    }
});

// @desc    Get visitor's chat history
// @route   GET /api/v1/visitor/history
// @access  Public
export const getChatHistory = asyncHandler(async (req, res, next) => {
    const { email } = req.query;

    if (!email) {
        return next(new ErrorResponse('Please provide an email', 400));
    }

    try {
        // Find visitor user
        const visitorUser = await VisitorUser.findOne({ email });
        console.log('Found visitor user:', visitorUser); // Debug log

        if (!visitorUser) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        // First get all sessions
        const allSessions = await VisitorSession.find({ visitorUser: visitorUser._id })
            .populate('chatHistory')
            .sort({ sessionStartTime: -1 });
        
        console.log('Found sessions:', allSessions); // Debug log

        // Get chat histories directly
        const chatHistories = await VisitorChatHistory.find({
            visitorSession: { $in: allSessions.map(s => s._id) }
        });
        
        console.log('Found chat histories:', chatHistories); // Debug log

        // Map sessions with their chat histories
        const history = allSessions
            .map(session => {
                const chatHistory = chatHistories.find(ch => 
                    ch.visitorSession.toString() === session._id.toString()
                );
                
                return {
                    sessionId: session._id,
                    startTime: session.sessionStartTime,
                    endTime: session.sessionEndTime,
                    isActive: session.isActive,
                    messages: chatHistory ? chatHistory.messages : []
                };
            })
            .filter(session => session.messages && session.messages.length > 0);

        console.log('Final formatted history:', history); // Debug log

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error in getChatHistory:', error);
        return next(new ErrorResponse('Error retrieving chat history', 500));
    }
});

// @desc    Add message to chat history
// @route   POST /api/v1/visitor/message
// @access  Public
export const addMessage = asyncHandler(async (req, res, next) => {
    const { sessionId, role, content, timestamp } = req.body;

    if (!sessionId || !role || !content) {
        return next(new ErrorResponse('Please provide sessionId, role, and content', 400));
    }

    try {
        // Find session
        const session = await VisitorSession.findById(sessionId);
        if (!session) {
            return next(new ErrorResponse('Session not found', 404));
        }

        // Find or create chat history
        let chatHistory = await VisitorChatHistory.findOne({ visitorSession: sessionId });
        if (!chatHistory) {
            chatHistory = await VisitorChatHistory.create({
                visitorSession: sessionId,
                messages: []
            });
            
            // Update session with chat history reference
            session.chatHistory = chatHistory._id;
            await session.save();
        }

        // Add message
        chatHistory.messages.push({
            role,
            content,
            timestamp: timestamp || new Date()
        });
        await chatHistory.save();

        // Update session
        await session.incrementMessageCount();

        res.status(200).json({
            success: true,
            data: chatHistory
        });
    } catch (error) {
        console.error('Error in addMessage:', error);
        return next(new ErrorResponse('Error adding message', 500));
    }
});

// @desc    End visitor session
// @route   PUT /api/v1/visitor/session/:sessionId/end
// @access  Public
export const endSession = asyncHandler(async (req, res, next) => {
    const { sessionId } = req.params;

    try {
        const session = await VisitorSession.findById(sessionId);
        if (!session) {
            return next(new ErrorResponse('Session not found', 404));
        }

        await session.endSession();

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error in endSession:', error);
        return next(new ErrorResponse('Error ending session', 500));
    }
});

// @desc    Get all visitors for a chatbot
// @route   GET /api/v1/visitor/list/:chatbotId
// @access  Private
export const getVisitorsList = asyncHandler(async (req, res, next) => {
    const { chatbotId } = req.params;

    try {
        // Verify chatbot exists
        const chatbot = await Chatbot.findById(chatbotId);
        if (!chatbot) {
            return next(new ErrorResponse('Chatbot not found', 404));
        }

        const visitors = await VisitorUser.aggregate([
            {
                $lookup: {
                    from: 'visitorsessions',
                    localField: '_id',
                    foreignField: 'visitorUser',
                    as: 'sessions'
                }
            },
            {
                $match: {
                    'sessions.chatbot': new mongoose.Types.ObjectId(chatbotId)
                }
            },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    lastLoginAt: { $max: '$sessions.sessionStartTime' },
                    totalSessions: { $size: '$sessions' },
                    metadata: 1
                }
            },
            {
                $sort: { lastLoginAt: -1 }
            }
        ]);

        // If no visitors found through aggregation, try direct find
        if (!visitors.length) {
            const allVisitors = await VisitorUser.find()
                .populate({
                    path: 'sessions',
                    match: { chatbot: chatbotId }
                })
                .select('email lastLoginAt metadata')
                .sort('-lastLoginAt');

            const filteredVisitors = allVisitors.filter(visitor => visitor.sessions && visitor.sessions.length > 0);
            
            return res.status(200).json({
                success: true,
                data: filteredVisitors
            });
        }

        res.status(200).json({
            success: true,
            data: visitors
        });
    } catch (error) {
        console.error('Error in getVisitorsList:', error);
        return next(new ErrorResponse('Error retrieving visitors list', 500));
    }
});

// @desc    Get visitor by email
// @route   GET /api/v1/visitor/user
// @access  Public
export const getVisitorByEmail = asyncHandler(async (req, res, next) => {
    const { email } = req.query;

    if (!email) {
        return next(new ErrorResponse('Please provide an email', 400));
    }

    const visitor = await VisitorUser.findOne({ email });
    
    if (!visitor) {
        return next(new ErrorResponse('Visitor not found', 404));
    }

    res.status(200).json({
        success: true,
        data: visitor
    });
});

// @desc    Get visitor chat history
// @route   GET /api/v1/visitor/history/:visitorId
// @access  Public
export const getVisitorChatHistory = asyncHandler(async (req, res, next) => {
    const { visitorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(visitorId)) {
        return next(new ErrorResponse('Invalid visitor ID', 400));
    }

    try {
        console.log('Finding chat histories for visitor:', visitorId);
        
        // Get all chat histories for this visitor's sessions
        const chatHistories = await VisitorChatHistory.find()
            .populate({
                path: 'visitorSession',
                match: { visitorUser: visitorId },
                select: 'createdAt isActive endTime'
            });

        console.log('Found chat histories:', chatHistories);

        // Filter out any chat histories where session didn't match and has no messages
        const validChatHistories = chatHistories.filter(history => 
            history.visitorSession && history.messages && history.messages.length > 0
        );

        console.log('Valid chat histories with messages:', validChatHistories);

        // Format the response
        const formattedSessions = validChatHistories.map(history => ({
            _id: history._id,
            sessionId: history.visitorSession._id,
            startTime: history.visitorSession.createdAt,
            endTime: history.visitorSession.endTime,
            isActive: history.visitorSession.isActive !== false,
            messages: history.messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }))
        }));

        console.log('Formatted sessions:', formattedSessions);

        res.status(200).json({
            success: true,
            count: formattedSessions.length,
            data: formattedSessions
        });
    } catch (error) {
        console.error('Error in getVisitorChatHistory:', error);
        return next(new ErrorResponse('Error retrieving chat history', 500));
    }
});

// @desc    Get analytics for a chatbot's visitors
// @route   GET /api/v1/visitor/analytics/chatbot/:chatbotId
// @access  Private
export const getChatbotVisitorAnalytics = asyncHandler(async (req, res, next) => {
    const { chatbotId } = req.params;

    const analytics = await VisitorSession.aggregate([
        {
            $match: { chatbot: chatbotId }
        },
        {
            $lookup: {
                from: 'visitorchathistories',
                localField: '_id',
                foreignField: 'session',
                as: 'messages'
            }
        },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                activeSessions: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                totalMessages: { $sum: { $size: '$messages' } },
                avgDuration: {
                    $avg: {
                        $divide: [
                            { $subtract: [
                                { $ifNull: ['$sessionEndTime', new Date()] },
                                '$sessionStartTime'
                            ]},
                            60000 // Convert to minutes
                        ]
                    }
                },
                lastActive: { $max: '$lastMessageAt' },
                // Collect all messages for topic analysis
                allMessages: { $push: '$messages' },
                // Collect session start times for hourly analysis
                sessionTimes: { $push: '$sessionStartTime' }
            }
        },
        {
            $project: {
                _id: 0,
                totalSessions: 1,
                activeSessions: 1,
                totalMessages: 1,
                avgDuration: 1,
                lastActive: 1,
                responseRate: {
                    $multiply: [
                        {
                            $divide: [
                                { $size: { $filter: {
                                    input: '$allMessages',
                                    as: 'msg',
                                    cond: { $eq: ['$$msg.role', 'assistant'] }
                                }}},
                                { $size: { $filter: {
                                    input: '$allMessages',
                                    as: 'msg',
                                    cond: { $eq: ['$$msg.role', 'user'] }
                                }}}
                            ]
                        },
                        100
                    ]
                },
                // Extract hour from session times for engagement analysis
                engagementByHour: {
                    $map: {
                        input: { $range: [0, 24] },
                        as: 'hour',
                        in: {
                            hour: '$$hour',
                            count: {
                                $size: {
                                    $filter: {
                                        input: '$sessionTimes',
                                        as: 'time',
                                        cond: { $eq: [{ $hour: '$$time' }, '$$hour'] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ]);

    const result = analytics[0] || {
        totalSessions: 0,
        activeSessions: 0,
        totalMessages: 0,
        avgDuration: 0,
        responseRate: 0,
        lastActive: new Date(),
        topics: [],
        engagementByHour: Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }))
    };

    res.status(200).json({
        success: true,
        data: result
    });
});

// @desc    Get analytics for a specific visitor
// @route   GET /api/v1/visitor/analytics/visitor/:visitorId
// @access  Private
export const getVisitorAnalytics = asyncHandler(async (req, res, next) => {
    const { visitorId } = req.params;

    const analytics = await VisitorSession.aggregate([
        {
            $match: { visitorUser: visitorId }
        },
        {
            $lookup: {
                from: 'visitorchathistories',
                localField: '_id',
                foreignField: 'session',
                as: 'messages'
            }
        },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                activeSessions: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                totalMessages: { $sum: { $size: '$messages' } },
                avgDuration: {
                    $avg: {
                        $divide: [
                            { $subtract: [
                                { $ifNull: ['$sessionEndTime', new Date()] },
                                '$sessionStartTime'
                            ]},
                            60000 // Convert to minutes
                        ]
                    }
                },
                lastActive: { $max: '$lastMessageAt' },
                // Collect session start times for hourly analysis
                sessionTimes: { $push: '$sessionStartTime' }
            }
        },
        {
            $project: {
                _id: 0,
                totalSessions: 1,
                activeSessions: 1,
                totalMessages: 1,
                avgDuration: 1,
                lastActive: 1,
                averageMessagesPerSession: { $divide: ['$totalMessages', '$totalSessions'] },
                engagementByHour: {
                    $map: {
                        input: { $range: [0, 24] },
                        as: 'hour',
                        in: {
                            hour: '$$hour',
                            count: {
                                $size: {
                                    $filter: {
                                        input: '$sessionTimes',
                                        as: 'time',
                                        cond: { $eq: [{ $hour: '$$time' }, '$$hour'] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ]);

    const result = analytics[0] || {
        totalSessions: 0,
        activeSessions: 0,
        totalMessages: 0,
        avgDuration: 0,
        averageMessagesPerSession: 0,
        lastActive: new Date(),
        engagementByHour: Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }))
    };

    res.status(200).json({
        success: true,
        data: result
    });
});
