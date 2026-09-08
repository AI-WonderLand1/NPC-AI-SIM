import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Languages,
  LayoutDashboard,
  Moon,
  Search,
  Settings,
  Sun,
  UserCircle2,
  X,
} from 'lucide-react';
import { EDITOR_LANGUAGES } from './editorLanguages.js';

type EditorTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'npc-ai-sim:theme';
const LANGUAGE_STORAGE_KEY = 'npc-ai-sim:language';

function initialTheme(): EditorTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

function initialLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && EDITOR_LANGUAGES.some((language) => language.code === stored)) return stored;
  const browserLanguage = window.navigator.language.split('-')[0]?.toLowerCase();
  return EDITOR_LANGUAGES.some((language) => language.code === browserLanguage) ? browserLanguage : 'en';
}

export default function EditorProfileMenu() {
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [theme, setTheme] = useState<EditorTheme>(initialTheme);
  const [languageCode, setLanguageCode] = useState(initialLanguage);
  const [query, setQuery] = useState('');

  const selectedLanguage = useMemo(
    () => EDITOR_LANGUAGES.find((language) => language.code === languageCode) ?? EDITOR_LANGUAGES.find((language) => language.code === 'en')!,
    [languageCode],
  );

  const filteredLanguages = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return EDITOR_LANGUAGES;
    return EDITOR_LANGUAGES.filter((language) => (
      language.name.toLocaleLowerCase().includes(normalized)
      || language.nativeName?.toLocaleLowerCase().includes(normalized)
      || language.code.toLocaleLowerCase().includes(normalized)
    ));
  }, [query]);

  useEffect(() => {
    document.documentElement.dataset.npcTheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = languageCode;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  }, [languageCode]);

  const chooseLanguage = (code: string) => {
    setLanguageCode(code);
    setLanguageOpen(false);
    setQuery('');
  };

  return (
    <div className="npc-profile-area">
      {open && (
        <div className="npc-profile-settings" role="dialog" aria-label="Profile settings">
          <div className="npc-profile-settings-head">
            <div>
              <strong>Profile</strong>
              <span>Editor preferences</span>
            </div>
            <button type="button" onClick={() => { setOpen(false); setLanguageOpen(false); }} aria-label="Close profile settings"><X size={15} /></button>
          </div>

          <div className="npc-profile-menu-section">
            <span className="npc-profile-menu-label">Appearance</span>
            <div className="npc-theme-toggle" role="group" aria-label="Appearance">
              <button type="button" className={theme === 'dark' ? 'is-active' : ''} onClick={() => setTheme('dark')}><Moon size={14} /> Dark</button>
              <button type="button" className={theme === 'light' ? 'is-active' : ''} onClick={() => setTheme('light')}><Sun size={14} /> Light</button>
            </div>
          </div>

          <button className="npc-profile-menu-row" type="button" onClick={() => setLanguageOpen((value) => !value)}>
            <Languages size={15} />
            <span><strong>Language</strong><small>{selectedLanguage.name}</small></span>
            <ChevronRight size={14} />
          </button>

          <a className="npc-profile-menu-row" href="https://dreammakerhub.website/dashboard">
            <LayoutDashboard size={15} />
            <span><strong>Main Dashboard</strong><small>Return to AI WONDERLAND</small></span>
            <ChevronRight size={14} />
          </a>

          {languageOpen && (
            <div className="npc-language-popover" role="dialog" aria-label="Choose language">
              <div className="npc-language-head">
                <strong>Language</strong>
                <span>{EDITOR_LANGUAGES.length} ISO 639-1 languages</span>
              </div>
              <label className="npc-language-search">
                <Search size={14} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search languages…" autoFocus />
              </label>
              <div className="npc-language-list">
                {filteredLanguages.map((language) => (
                  <button key={language.code} type="button" className={language.code === languageCode ? 'is-active' : ''} onClick={() => chooseLanguage(language.code)}>
                    <span><strong>{language.name}</strong><small>{language.nativeName || language.name}</small></span>
                    <em>{language.code.toUpperCase()}</em>
                    {language.code === languageCode && <Check size={14} />}
                  </button>
                ))}
                {filteredLanguages.length === 0 && <p className="npc-language-empty">No language matches “{query}”.</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <button className="npc-profile-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="npc-profile-avatar"><UserCircle2 size={19} /></span>
        <span><strong>Profile</strong><small>{selectedLanguage.name} • {theme === 'dark' ? 'Dark' : 'Light'}</small></span>
        <Settings size={15} />
      </button>
    </div>
  );
}
