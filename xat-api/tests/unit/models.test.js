const { Conversation, Prompt } = require('../../src/models');

describe('Models Relations', () => {
    test('Conversation hauria de tenir molts Prompts', () => {
        expect(Conversation.associations).toHaveProperty('Prompts');
    });

    test('Prompt hauria de pertànyer a Conversation', () => {
        expect(Prompt.associations).toHaveProperty('Conversation');
    });
});