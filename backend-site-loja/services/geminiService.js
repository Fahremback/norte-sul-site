// backend-site-loja/services/geminiService.js
const { GoogleGenAI, Type } = require('@google/genai');

// O cliente é inicializado uma vez e reutilizado.
let aiClient = null;

function getClient() {
    if (aiClient) {
        return aiClient;
    }
    // A chave da API deve ser obtida exclusivamente da variável de ambiente `process.env.API_KEY`.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("A variável de ambiente API_KEY (com a chave Gemini) não está configurada no servidor.");
        throw new Error("A chave da API para o serviço de IA não está configurada no servidor.");
    }
    // Conforme as diretrizes, inicialize com um parâmetro nomeado.
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
}

const productSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'Nome conciso e vendável para o produto.' },
        description: { type: Type.STRING, description: 'Descrição detalhada (usos, materiais, cor, diferenciais).' },
        category: { type: Type.STRING, description: 'Categoria específica de informática (ex: Carregador, Cabo de Dados, Mouse Gamer).' },
        brand: { type: Type.STRING, nullable: true, description: 'A marca do produto. Se não for visível, retorne null.' },
        model: { type: Type.STRING, nullable: true, description: 'O modelo específico. Se não for visível, retorne null.' },
        color: { type: Type.STRING, nullable: true, description: 'A cor principal do produto.' },
        power: { type: Type.STRING, nullable: true, description: 'A potência, se aplicável (ex: "25W", "65W").' },
        dimensions: { type: Type.STRING, nullable: true, description: 'As dimensãoes, se visíveis (ex: "15cm x 7cm").' },
        weight: { type: Type.STRING, nullable: true, description: 'O peso, se informado na embalagem (ex: "200g").' },
        compatibility: { type: Type.STRING, nullable: true, description: 'Compatibilidade, se mencionada (ex: "iPhone, Samsung, Xiaomi").' },
        otherSpecs: { type: Type.STRING, nullable: true, description: 'Outras especificações técnicas importantes não cobertas acima.' },
    },
    required: ["name", "description", "category"]
};


async function processProductImage(base64Image, mimeType, userKeywords = '') {
    const ai = getClient();

    const imagePart = {
        inlineData: {
            mimeType,
            data: base64Image,
        },
    };

    const prompt = `Você é um especialista em catalogação de e-commerce para a loja de informática 'Norte Sul Informática'. Analise a imagem do produto e as palavras-chave do usuário (se fornecidas).
Sua tarefa é extrair o máximo de informações possível e formatá-las como um único objeto JSON, seguindo o schema providenciado.

Palavras-chave do usuário: "${userKeywords || 'Nenhuma'}"

Analise a imagem com atenção. Se uma informação não for claramente visível ou aplicável, retorne null para o campo correspondente. O nome e a descrição devem ser criativos e otimizados para venda.`;

    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: productSchema
            }
        });
        
        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);

        // Garante que campos opcionais que vieram como string vazia se tornem null
        for (const key in data) {
            if (data[key] === "") {
                data[key] = null;
            }
        }
        
        return data;
    } catch (error) {
        console.error("Erro ao chamar a API Gemini:", error);
        // Lança um erro mais específico que pode ser capturado pelo errorHandler
        throw new Error(`Falha ao processar a imagem com a IA.`);
    }
}

module.exports = {
    processProductImage
};