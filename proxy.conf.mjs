import { config } from 'dotenv';
config();

export default {
    '/openaiAutomation': {
        target: 'https://api.openai.com/v1',
        pathRewrite: {
            '^/openaiAutomation': '',
        },
        changeOrigin: true,
        bypass: function (req) {
            req.headers.authorization = `Bearer ${process.env.OPENAI_API_KEY}`;
        },
    },
    '/ollamaAutomamtion': {
        target: 'http://localhost:11434/api/chat',
        pathRewrite: {
            '^/ollamaAutomamtion/chat/completions': '',
        },
        changeOrigin: true,
        bypass: function (req) {
            req.headers.authorization = `Bearer ${process.env.OPENAI_API_KEY}`;
        },
    },
};
