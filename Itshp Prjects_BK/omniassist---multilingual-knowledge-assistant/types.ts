
export type Language = 'en' | 'fr';

export interface FileData {
  id: string;
  name: string;
  type: string;
  content: string; // Base64 for images/docs or text for txt files
  mimeType: string;
  size: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  sources?: GroundingSource[];
}

export interface TranslationStrings {
  title: string;
  sidebarTitle: string;
  uploadBtn: string;
  dropZoneText: string;
  noFiles: string;
  chatPlaceholder: string;
  assistantInstruction: string;
  filesLimit: string;
  remove: string;
  learning: string;
  welcome: string;
  welcomeSubtitle: string;
  sourcesTitle: string;
  stealthModeOn: string;
  stealthModeOff: string;
  setupTitle: string;
  setupDesc: string;
  setupBtn: string;
  setupLink: string;
}

export const Translations: Record<Language, TranslationStrings> = {
  en: {
    title: "OmniAssist",
    sidebarTitle: "Knowledge Base",
    uploadBtn: "Upload Knowledge",
    dropZoneText: "Drag and drop or click to upload files",
    noFiles: "No files uploaded yet. Add some to train your assistant!",
    chatPlaceholder: "Ask anything about your uploaded files or a website...",
    assistantInstruction: "You are a specialized assistant. Use the provided documents/images FIRST. If the information is not there, use Google Search to find current information (especially if a URL like bk.rw is mentioned). Always cite your sources. Respond in English.",
    filesLimit: "File size exceeds limit (5MB).",
    remove: "Remove",
    learning: "Analyzing knowledge & web...",
    welcome: "Welcome to OmniAssist",
    welcomeSubtitle: "Upload documents or ask me to check a website.",
    sourcesTitle: "Sources found on the web:",
    stealthModeOn: "Invisible typing active",
    stealthModeOff: "Normal typing active",
    setupTitle: "Setup Your AI Assistant",
    setupDesc: "To function locally, OmniAssist needs a Gemini API Key. Click below to securely select or create your key.",
    setupBtn: "Connect with Gemini",
    setupLink: "Learn about API billing"
  },
  fr: {
    title: "OmniAssist",
    sidebarTitle: "Base de Connaissances",
    uploadBtn: "Charger des connaissances",
    dropZoneText: "Glissez-déposez ou cliquez pour charger des fichiers",
    noFiles: "Aucun fichier chargé. Ajoutez-en ou demandez-moi de consulter un site !",
    chatPlaceholder: "Posez une question sur vos fichiers ou un site web...",
    assistantInstruction: "Vous êtes un assistant spécialisé. Utilisez d'abord les documents/images fournis. Si l'information n'y est pas, utilisez Google Search pour trouver des informations à jour (surtout si une URL comme bk.rw est mentionnée). Citez toujours vos sources. Répondez en Français.",
    filesLimit: "Le fichier dépasse la limite de taille (5 Mo).",
    remove: "Supprimer",
    learning: "Analyse des connaissances et du web...",
    welcome: "Bienvenue sur OmniAssist",
    welcomeSubtitle: "Chargez des documents ou demandez-moi de vérifier un site web.",
    sourcesTitle: "Sources trouvées sur le web :",
    stealthModeOn: "Saisie invisible activée",
    stealthModeOff: "Saisie normale activée",
    setupTitle: "Configurez votre Assistant IA",
    setupDesc: "Pour fonctionner localement, OmniAssist nécessite une clé API Gemini. Cliquez ci-dessous pour sélectionner la vôtre en toute sécurité.",
    setupBtn: "Se connecter à Gemini",
    setupLink: "En savoir plus sur la facturation API"
  }
};
