
import React from 'react';
import { Language, FileData, Translations } from '../types';

interface SidebarProps {
  language: Language;
  setLanguage: (l: Language) => void;
  files: FileData[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  language, 
  setLanguage, 
  files, 
  onFileUpload,
  onRemoveFile 
}) => {
  const t = Translations[language];

  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) return { icon: 'fa-image', color: 'bg-amber-100 text-amber-600' };
    if (mimeType === 'application/pdf') return { icon: 'fa-file-pdf', color: 'bg-red-100 text-red-600' };
    if (fileName.endsWith('.csv') || fileName.endsWith('.json')) return { icon: 'fa-database', color: 'bg-emerald-100 text-emerald-600' };
    if (fileName.endsWith('.md')) return { icon: 'fa-file-code', color: 'bg-blue-100 text-blue-600' };
    return { icon: 'fa-file-lines', color: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="w-full md:w-80 h-full border-r bg-white flex flex-col shadow-sm">
      <div className="p-6 border-b flex justify-between items-center bg-indigo-50">
        <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
          <i className="fas fa-brain"></i>
          {t.title}
        </h1>
        <button 
          onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
          className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
        >
          {language === 'en' ? 'English' : 'Français'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            {t.sidebarTitle}
          </h2>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
            {files.length}
          </span>
        </div>

        <div className="space-y-3">
          {files.length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <i className="fas fa-folder-open text-slate-300 text-3xl mb-3"></i>
              <p className="text-xs text-slate-400">{t.noFiles}</p>
            </div>
          ) : (
            files.map((file) => {
              const { icon, color } = getFileIcon(file.mimeType, file.name);
              return (
                <div 
                  key={file.id} 
                  className="group flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <i className={`fas ${icon}`}></i>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t">
        <label className="block w-full cursor-pointer">
          <input 
            type="file" 
            multiple 
            onChange={onFileUpload} 
            className="hidden" 
            accept="image/*,.txt,.pdf,.csv,.json,.md,.js,.py,.html,.css"
          />
          <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200">
            <i className="fas fa-plus"></i>
            {t.uploadBtn}
          </div>
        </label>
      </div>
    </div>
  );
};

export default Sidebar;
