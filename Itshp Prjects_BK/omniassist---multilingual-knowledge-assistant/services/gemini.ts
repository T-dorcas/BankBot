
import { GoogleGenAI, Part } from "@google/genai";
import { FileData, Language, Translations, GroundingSource } from "../types";

const isTextBased = (mimeType: string, fileName: string) => {
  const textExtensions = ['.txt', '.csv', '.json', '.md', '.js', '.py', '.html', '.css', '.ts', '.tsx'];
  return mimeType.startsWith('text/') || textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const chatWithGeminiStream = async (
  prompt: string,
  files: FileData[],
  language: Language,
  onChunk: (chunk: string, sources?: GroundingSource[]) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const t = Translations[language];
  const systemPrompt = t.assistantInstruction;

  const fileParts: Part[] = files.map(file => {
    if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
      const base64Data = file.content.includes(',') ? file.content.split(',')[1] : file.content;
      return {
        inlineData: {
          data: base64Data,
          mimeType: file.mimeType
        }
      };
    } 
    
    if (isTextBased(file.mimeType, file.name)) {
      try {
        const base64Content = file.content.includes(',') ? file.content.split(',')[1] : file.content;
        const decoded = atob(base64Content);
        return { text: `--- CONTENT OF FILE: ${file.name} ---\n${decoded}\n--- END OF FILE ---` };
      } catch (e) {
        return { text: `[Error reading text content of ${file.name}]` };
      }
    }

    return { text: `[Unsupported file type for ${file.name}]` };
  });

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [...fileParts, { text: prompt }]
    },
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      tools: [{ googleSearch: {} }]
    }
  });

  let fullText = "";
  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      
      // Extract grounding metadata if available in the chunk
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      let sources: GroundingSource[] | undefined;
      
      if (groundingChunks) {
        sources = groundingChunks
          .filter(c => c.web)
          .map(c => ({
            title: c.web?.title || "Source",
            uri: c.web?.uri || ""
          }));
      }
      
      onChunk(text, sources);
    }
  }
};
