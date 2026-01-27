const express = require('express');
const router = express.Router();
const { registerPrompt, getConversation, listOllamaModels } = require('../controllers/chatController');

/**
 * @swagger
 * /api/chat/prompt:
 *   post:
 *     summary: Crear un nou prompt o afegir-lo a una conversa existent
 *     description: Aquest endpoint permet enviar un prompt per a generar una resposta amb Ollama. Pot crear una nova conversa o continuar una existent.
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la conversa (opcional per a conversa existent)
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               prompt:
 *                 type: string
 *                 description: Text del prompt
 *                 minLength: 1
 *                 maxLength: 5000
 *                 example: Explica'm què és la intel·ligència artificial en termes senzills
 *               model:
 *                 type: string
 *                 description: Model d'Ollama a utilitzar
 *                 default: qwen2.5vl:7b
 *                 example: qwen2.5vl:7b
 *               stream:
 *                 type: boolean
 *                 description: Indica si la resposta ha de ser en streaming (SSE)
 *                 default: false
 *                 example: false
 *           examples:
 *             nova_conversa:
 *               summary: Nova conversa sense ID
 *               value:
 *                 prompt: Hola! Com estàs?
 *                 model: qwen2.5vl:7b
 *                 stream: false
 *             conversa_existent:
 *               summary: Afegir a conversa existent
 *               value:
 *                 conversationId: 550e8400-e29b-41d4-a716-446655440000
 *                 prompt: I tu què en penses?
 *                 model: qwen2.5vl:7b
 *                 stream: false
 *             amb_streaming:
 *               summary: Resposta en streaming
 *               value:
 *                 prompt: Explica'm un conte llarg
 *                 model: qwen2.5vl:7b
 *                 stream: true
 *     responses:
 *       201:
 *         description: Prompt registrat i resposta generada correctament
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversationId:
 *                   type: string
 *                   format: uuid
 *                   description: ID de la conversa (nova o existent)
 *                 promptId:
 *                   type: string
 *                   format: uuid
 *                   description: ID del prompt creat
 *                 prompt:
 *                   type: string
 *                   description: Text del prompt enviat
 *                 response:
 *                   type: string
 *                   description: Resposta generada per Ollama
 *                 model:
 *                   type: string
 *                   description: Model utilitzat
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp de la resposta
 *             examples:
 *               resposta_exitosa:
 *                 summary: Resposta exitosa
 *                 value:
 *                   conversationId: 550e8400-e29b-41d4-a716-446655440000
 *                   promptId: 660e8400-e29b-41d4-a716-446655440001
 *                   prompt: Explica'm què és la intel·ligència artificial
 *                   response: La intel·ligència artificial (IA) és la capacitat de les màquines d'imitar la intel·ligència humana. Inclou aprenentatge automàtic, processament del llenguatge natural i visió per computador. Les aplicacions van des d'assistents virtuals fins a vehicles autònoms.
 *                   model: qwen2.5vl:7b
 *                   timestamp: 2026-01-27T10:30:00.000Z
 *               resposta_llarga:
 *                 summary: Resposta amb text llarg
 *                 value:
 *                   conversationId: 770e8400-e29b-41d4-a716-446655440002
 *                   promptId: 880e8400-e29b-41d4-a716-446655440003
 *                   prompt: Fes un resum de la història de Catalunya
 *                   response: Catalunya té una història rica que s'estén durant mil·lennis. Els ibers van ser els primers habitants coneguts, seguits pels romans que van fundar ciutats com Tarraco (Tarragona). Durant l'edat mitjana, Catalunya va esdevenir un poder marítim important amb la Corona d'Aragó. El segle XX va veure períodes de repressió i autonomia alternats, culminant amb l'establiment de l'actual autonomia el 1979. Avui, Catalunya és una comunitat autònoma amb institucions pròpies i una identitat cultural forta.
 *                   model: qwen2.5vl:7b
 *                   timestamp: 2026-01-27T10:35:00.000Z
 *       400:
 *         description: Dades invàlides o prompt buit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Missatge d'error descriptiu
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *             examples:
 *               prompt_buit:
 *                 summary: Prompt buit
 *                 value:
 *                   message: El prompt és obligatori
 *               id_invalid:
 *                 summary: ID de conversa invàlid
 *                 value:
 *                   message: ID de conversa invàlid
 *                   errors:
 *                     - field: conversationId
 *                       message: El format UUID no és vàlid
 *       404:
 *         description: Conversa no trobada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               no_trobada:
 *                 summary: Conversa no trobada
 *                 value:
 *                   message: Conversa no trobada amb l'ID proporcionat
 *       500:
 *         description: Error intern del servidor o error amb Ollama
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *             examples:
 *               error_ollama:
 *                 summary: Error de connexió amb Ollama
 *                 value:
 *                   message: No s'ha pogut generar la resposta
 *                   error: Error de connexió amb el servidor d'Ollama
 */
router.post('/prompt', registerPrompt);

/**
 * @swagger
 * /api/chat/conversation/{id}:
 *   get:
 *     summary: Obtenir una conversa per ID amb tots els seus prompts
 *     description: Recupera una conversa completa amb tots els prompts i respostes associades
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID de la conversa
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Conversa trobada amb èxit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: ID de la conversa
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Data de creació
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Data d'última actualització
 *                 prompts:
 *                   type: array
 *                   description: Llista de prompts de la conversa
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       prompt:
 *                         type: string
 *                       response:
 *                         type: string
 *                       model:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *             examples:
 *               conversa_amb_prompts:
 *                 summary: Conversa amb múltiples prompts
 *                 value:
 *                   id: 550e8400-e29b-41d4-a716-446655440000
 *                   createdAt: 2026-01-27T09:00:00.000Z
 *                   updatedAt: 2026-01-27T10:30:00.000Z
 *                   prompts:
 *                     - id: 660e8400-e29b-41d4-a716-446655440001
 *                       prompt: Hola! Com estàs?
 *                       response: Hola! Estic bé, gràcies per preguntar. Sóc un assistent d'IA i estic aquí per ajudar-te. Com et puc ajudar avui?
 *                       model: qwen2.5vl:7b
 *                       createdAt: 2026-01-27T09:00:00.000Z
 *                     - id: 770e8400-e29b-41d4-a716-446655440002
 *                       prompt: Explica'm què és Node.js
 *                       response: Node.js és un entorn d'execució de JavaScript del costat del servidor. Permet executar codi JavaScript fora del navegador, utilitzant el motor V8 de Chrome. És especialment popular per crear aplicacions web escalables i APIs REST.
 *                       model: qwen2.5vl:7b
 *                       createdAt: 2026-01-27T10:15:00.000Z
 *                     - id: 880e8400-e29b-41d4-a716-446655440003
 *                       prompt: Dona'm un exemple d'ús
 *                       response: "Un exemple clàssic és crear un servidor HTTP:\n\nconst http = require('http');\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, {'Content-Type': 'text/plain'});\n  res.end('Hola Món!');\n});\nserver.listen(3000);\n\nAquest codi crea un servidor que escolta al port 3000."
 *                       model: qwen2.5vl:7b
 *                       createdAt: 2026-01-27T10:30:00.000Z
 *               conversa_nova_sense_prompts:
 *                 summary: Conversa nova sense prompts
 *                 value:
 *                   id: 990e8400-e29b-41d4-a716-446655440004
 *                   createdAt: 2026-01-27T11:00:00.000Z
 *                   updatedAt: 2026-01-27T11:00:00.000Z
 *                   prompts: []
 *       400:
 *         description: ID invàlid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               uuid_invalid:
 *                 summary: Format UUID invàlid
 *                 value:
 *                   message: El format de l'ID no és vàlid. Utilitza un UUID vàlid.
 *       404:
 *         description: Conversa no trobada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               no_existeix:
 *                 summary: Conversa no existeix
 *                 value:
 *                   message: No s'ha trobat cap conversa amb aquest ID
 */
router.get('/conversation/:id', getConversation);

/**
 * @swagger
 * /api/chat/models:
 *   get:
 *     summary: Llistar models disponibles a Ollama
 *     description: Retorna la llista de tots els models disponibles al servidor Ollama
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Llista de models disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_models:
 *                   type: integer
 *                   description: Nombre total de models disponibles
 *                 models:
 *                   type: array
 *                   description: Llista de models
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Nom del model
 *                       modified_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de modificació
 *                       size:
 *                         type: integer
 *                         description: Mida del model en bytes
 *                       digest:
 *                         type: string
 *                         description: Hash digest del model
 *             examples:
 *               models_disponibles:
 *                 summary: Models disponibles
 *                 value:
 *                   total_models: 3
 *                   models:
 *                     - name: qwen2.5vl:7b
 *                       modified_at: 2026-01-15T12:00:00.000Z
 *                       size: 7365960704
 *                       digest: sha256:abc123def456...
 *                     - name: llama2:13b
 *                       modified_at: 2026-01-10T10:30:00.000Z
 *                       size: 13654876160
 *                       digest: sha256:def789ghi012...
 *                     - name: mistral:7b
 *                       modified_at: 2026-01-20T14:45:00.000Z
 *                       size: 7242145792
 *                       digest: sha256:ghi345jkl678...
 *               model_unic:
 *                 summary: Un sol model disponible
 *                 value:
 *                   total_models: 1
 *                   models:
 *                     - name: qwen2.5vl:7b
 *                       modified_at: 2026-01-15T12:00:00.000Z
 *                       size: 7365960704
 *                       digest: sha256:abc123def456...
 *       500:
 *         description: Error al recuperar models d'Ollama
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *             examples:
 *               error_conexio:
 *                 summary: Error de connexió
 *                 value:
 *                   message: No s'han pogut recuperar els models
 *                   error: "ECONNREFUSED: No es pot connectar amb el servidor Ollama"
 */
router.get('/models', listOllamaModels);

module.exports = router;