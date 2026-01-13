const request = require('supertest');
const app = require('../../server');
const axios = require('axios');

jest.mock('axios');

describe('ChatController Error Paths', () => {
    test('Hauria de gestionar errors 500 quan Ollama no respon a /models', async () => {
        axios.get.mockRejectedValue({ 
            response: { status: 500, data: "Error d'Ollama" } 
        });
        
        const res = await request(app).get('/api/chat/models');
        expect(res.status).toBe(500);
        // Utilitzem cometes dobles per evitar conflictes amb l'apòstrof
        expect(res.body.message).toBe("No s'han pogut recuperar els models");
    });

    test('Hauria de retornar missatge per defecte si la generació falla', async () => {
        axios.post.mockRejectedValue(new Error('Network error'));
        
        const res = await request(app)
            .post('/api/chat/prompt')
            .send({ prompt: 'Test error', stream: false });

        expect(res.status).toBe(201); 
        expect(res.body.response).toContain('no he pogut generar una resposta');
    });
});