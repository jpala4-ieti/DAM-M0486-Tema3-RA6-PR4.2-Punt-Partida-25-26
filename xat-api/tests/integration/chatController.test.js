const request = require('supertest');
const app = require('../../server'); // Ajusta la ruta segons la teva estructura
const axios = require('axios');
const Conversation = require('../../src/models/Conversation');
const Prompt = require('../../src/models/Prompt');
const { EventEmitter } = require('events');

// Mocks
jest.mock('axios');
jest.mock('../../src/models/Conversation');
jest.mock('../../src/models/Prompt');
jest.mock('../../src/config/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
    }
}));

describe('ChatController - Unit & Integration Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Tests per a listOllamaModels ---
    describe('GET /api/chat/models', () => {
        test('Hauria de retornar la llista filtrada amb el model per defecte', async () => {
            process.env.CHAT_API_OLLAMA_MODEL = 'llama3';
            axios.get.mockResolvedValue({
                data: {
                    models: [
                        { name: 'llama3', size: 1000 },
                        { name: 'mistral', size: 2000 }
                    ]
                }
            });

            const res = await request(app).get('/api/chat/models');

            expect(res.status).toBe(200);
            expect(res.body.total_models).toBe(1);
            expect(res.body.models[0].name).toBe('llama3');
        });

        test('Hauria de gestionar errors de la API d’Ollama', async () => {
            axios.get.mockRejectedValue({
                response: { status: 500, data: 'Error d’Ollama' }
            });

            const res = await request(app).get('/api/chat/models');
            expect(res.status).toBe(500);
            expect(res.body.message).toBe("No s'han pogut recuperar els models");
        });
    });

    // --- Tests per a registerPrompt (No-Streaming) ---
    describe('POST /api/chat/prompt - Normal Response', () => {
        const mockPromptData = { prompt: 'Hola', stream: false };

        test('Hauria de fallar si el prompt està buit', async () => {
            const res = await request(app).post('/api/chat/prompt').send({ prompt: '' });
            expect(res.status).toBe(400);
        });

        test('Hauria de crear una nova conversa i prompt correctament', async () => {
            const mockConv = { id: '79201f35-47e2-45e0-94e8-8a8f4c6e6e28' };
            const mockNewPrompt = { id: 1, prompt: 'Hola', response: 'Adéu', update: jest.fn() };

            Conversation.create.mockResolvedValue(mockConv);
            axios.post.mockResolvedValue({ data: { response: 'Adéu' } });
            Prompt.create.mockResolvedValue(mockNewPrompt);

            const res = await request(app)
                .post('/api/chat/prompt')
                .send(mockPromptData);

            expect(res.status).toBe(201);
            expect(res.body.response).toBe('Adéu');
            expect(Conversation.create).toHaveBeenCalled();
        });

        test('Hauria de retornar error 400 si el conversationId no és un UUID vàlid', async () => {
            const res = await request(app)
                .post('/api/chat/prompt')
                .send({ prompt: 'Hola', conversationId: 'invalid-id' });
            
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('ID de conversa invàlid');
        });
    });

    // --- Tests per a registerPrompt (Streaming) ---
    describe('POST /api/chat/prompt - Streaming Response', () => {
        test('Hauria de gestionar correctament el flux SSE (Server-Sent Events)', (done) => {
            const mockConv = { id: '79201f35-47e2-45e0-94e8-8a8f4c6e6e28' };
            const mockPrompt = { id: 10, update: jest.fn().mockResolvedValue(true) };
            
            Conversation.create.mockResolvedValue(mockConv);
            Prompt.create.mockResolvedValue(mockPrompt);

            // Simulem el stream d'Axios
            const mockStream = new EventEmitter();
            axios.post.mockResolvedValue({ data: mockStream });

            request(app)
                .post('/api/chat/prompt')
                .send({ prompt: 'Hola', stream: true })
                .expect('Content-Type', /text\/event-stream/)
                .end((err, res) => {
                    if (err) return done(err);
                });

            // Emetem dades simulades pel stream
            setTimeout(() => {
                mockStream.emit('data', Buffer.from(JSON.stringify({ response: 'Part 1', done: false })));
                mockStream.emit('data', Buffer.from(JSON.stringify({ response: ' Part 2', done: true })));
            }, 10);

            // Verifiquem que el stream tanca correctament i actualitza la DB
            setTimeout(() => {
                expect(mockPrompt.update).toHaveBeenCalledWith({ response: 'Part 1 Part 2' });
                done();
            }, 50);
        });

        test('Hauria de gestionar errors durant el processament del stream', async () => {
            const mockConv = { id: '79201f35-47e2-45e0-94e8-8a8f4c6e6e28' };
            Conversation.create.mockResolvedValue(mockConv);
            Prompt.create.mockResolvedValue({ id: 1 });
            
            // Forcem error a axios
            axios.post.mockRejectedValue(new Error('Network Error'));

            const res = await request(app)
                .post('/api/chat/prompt')
                .send({ prompt: 'Hola', stream: true });

            // En SSE, l'error es rep dins del stream o com a tancament
            expect(res.header['content-type']).toContain('text/event-stream');
        });
    });

    // --- Tests per a getConversation ---
    describe('GET /api/chat/conversation/:id', () => {
        test('Hauria de retornar 404 si la conversa no existeix', async () => {
            const id = '79201f35-47e2-45e0-94e8-8a8f4c6e6e28';
            Conversation.findByPk.mockResolvedValue(null);

            const res = await request(app).get(`/api/chat/conversation/${id}`);
            expect(res.status).toBe(404);
        });

        test('Hauria de retornar la conversa amb prompts ordenats', async () => {
            const id = '79201f35-47e2-45e0-94e8-8a8f4c6e6e28';
            const mockData = { 
                id, 
                Prompts: [{ prompt: 'p1', response: 'r1' }] 
            };

            // Primera crida de validació d'existència
            Conversation.findByPk.mockResolvedValueOnce({ id });
            // Segona crida amb l'include
            Conversation.findByPk.mockResolvedValueOnce(mockData);

            const res = await request(app).get(`/api/chat/conversation/${id}`);
            
            expect(res.status).toBe(200);
            expect(res.body.Prompts).toHaveLength(1);
            expect(Conversation.findByPk).toHaveBeenCalledTimes(2);
        });
    });
});