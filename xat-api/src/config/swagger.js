const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Xat API',
            version: '1.0.0',
            description: 'API per gestionar converses i prompts amb Ollama'
        },
        servers: [
            {
                url: 'http://127.0.0.1:3000',
                description: 'Servidor de desenvolupament'
            }
        ],
        components: {
            schemas: {
                Conversation: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID únic de la conversa'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data de creació de la conversa'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: "Data d'última actualització"
                        },
                        prompts: {
                            type: 'array',
                            description: 'Llista de prompts associats a la conversa',
                            items: {
                                $ref: '#/components/schemas/Prompt'
                            }
                        }
                    }
                },
                Prompt: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID únic del prompt'
                        },
                        prompt: {
                            type: 'string',
                            description: 'Text del prompt enviat'
                        },
                        response: {
                            type: 'string',
                            description: "Resposta generada per l'LLM"
                        },
                        model: {
                            type: 'string',
                            description: 'Model utilitzat per generar la resposta'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data de creació del prompt'
                        },
                        conversationId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID de la conversa a la qual pertany'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: "Missatge descriptiu de l'error"
                        },
                        error: {
                            type: 'string',
                            description: 'Detalls tècnics de l\'error (opcional)'
                        },
                        errors: {
                            type: 'array',
                            description: 'Llista d\'errors de validació (opcional)',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        description: 'Camp que conté l\'error'
                                    },
                                    message: {
                                        type: 'string',
                                        description: 'Missatge específic de l\'error'
                                    }
                                }
                            }
                        }
                    }
                },
                OllamaModel: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Nom del model'
                        },
                        modified_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data de l\'última modificació del model'
                        },
                        size: {
                            type: 'integer',
                            description: 'Mida del model en bytes'
                        },
                        digest: {
                            type: 'string',
                            description: 'Hash digest del model per verificar integritat'
                        }
                    }
                },
                PromptRequest: {
                    type: 'object',
                    required: ['prompt'],
                    properties: {
                        conversationId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID de la conversa existent (opcional)'
                        },
                        prompt: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 5000,
                            description: 'Text del prompt a enviar'
                        },
                        model: {
                            type: 'string',
                            default: 'qwen2.5vl:7b',
                            description: 'Model d\'Ollama a utilitzar'
                        },
                        stream: {
                            type: 'boolean',
                            default: false,
                            description: 'Indica si la resposta ha de ser en streaming'
                        }
                    }
                },
                PromptResponse: {
                    type: 'object',
                    properties: {
                        conversationId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID de la conversa'
                        },
                        promptId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID del prompt creat'
                        },
                        prompt: {
                            type: 'string',
                            description: 'Text del prompt enviat'
                        },
                        response: {
                            type: 'string',
                            description: 'Resposta generada'
                        },
                        model: {
                            type: 'string',
                            description: 'Model utilitzat'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp de la resposta'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Prompts',
                description: 'Operacions relacionades amb la creació i gestió de prompts'
            },
            {
                name: 'Conversations',
                description: 'Operacions per recuperar converses i el seu historial'
            },
            {
                name: 'Chat',
                description: 'Operacions generals del xat i configuració de models'
            }
        ]
    },
    apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions);