import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Minimize2, Maximize2, Send, Sparkles, Gamepad2, Film, Zap, Cpu, MessageSquare, RotateCcw, Copy } from 'lucide-react';

type ProjectMode = 'game' | 'movie';

interface FloatingAiBuilderBubbleProps {
  activeProjectMode: ProjectMode;
  onBuildPrompt: (prompt: string, mode: ProjectMode) => void;
}

export const FloatingAiBuilderBubble: React.FC<FloatingAiBuilderBubbleProps> = ({
  activeProjectMode,
  onBuildPrompt,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 480 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDrag = (e: MouseEvent) => {
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - (isExpanded ? 480 : 380), e.clientX - dragOffset.x)),
      y: Math.max(0, Math.min(window.innerHeight - (isExpanded ? 520 : 120), e.clientY - dragOffset.y)),
    });
  };

  const handleDragEnd = () => {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    const userPrompt = prompt;
    setPrompt('');
    setHistory(prev => [...prev, { role: 'user', content: userPrompt }]);
    setIsProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `I'll add a patrol behavior node with voice alert triggers for ${activeProjectMode === 'game' ? 'interactive gameplay' : 'cinematic sequence'}.`,
        `Creating a behavior tree with perception → decision → dialogue flow. Adding spatial audio triggers.`,
        `Generating NPC dialogue variations based on personality profile. Configuring interruption handling.`,
        `Setting up animation state machine: idle → walk → alert → dialogue → return.`,
        `Adding visual perception node with configurable FOV and range. Connecting to behavior selector.`,
      ];
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];
      setHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsProcessing(false);
    }, 1000);

    onBuildPrompt(userPrompt, activeProjectMode);
  };

  const quickPrompts = [
    'Add patrol behavior with voice alerts',
    'Create dialogue tree for merchant NPC',
    'Setup combat AI with flanking',
    'Add cinematic camera sequence',
    'Create ambient idle animations',
  ];

  return (
    <div
      ref={bubbleRef}
      style={{
        left: position.x,
        top: position.y,
        width: isExpanded ? 480 : 380,
        height: isExpanded ? 520 : (isMinimized ? 48 : 420),
      }}
      className="fixed z-50 bg-[--color-bg-surface] border border-[--color-border-default] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col transition-all duration-300"
      onMouseDown={handleHeaderMouseDown}
    >
      {/* Header */}
      <div className="h-10 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between px-3 cursor-move select-none">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Alice AI Builder</p>
            <p className="text-white/70 text-[10px] font-mono">{activeProjectMode.toUpperCase()} STUDIO</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-white/80 hover:text-white transition-opacity"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-white/80 hover:text-white transition-opacity"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <RotateCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setIsMinimized(false); setIsExpanded(false); }}
            className="p-1 text-white/80 hover:text-white transition-opacity"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mode Selector */}
          <div className="p-3 border-b border-[--color-border-default] bg-[--color-bg-elevated]">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">MODE</span>
              <div className="flex items-center space-x-1 bg-[--color-bg-input] border border-[--color-border-default] rounded p-0.5">
                <button
                  onClick={() => {}}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    activeProjectMode === 'game'
                      ? 'bg-sky-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5 inline mr-1" />
                  Game Studio
                </button>
                <button
                  onClick={() => {}}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    activeProjectMode === 'movie'
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 inline mr-1" />
                  Movie Studio
                </button>
              </div>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Ask me to build behaviors, dialogues, or cinematic sequences</p>
                <p className="text-xs text-zinc-600 mt-1">Examples: "Add patrol with voice alerts", "Create merchant dialogue tree"</p>
              </div>
            ) : (
              history.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-[--color-border-default]'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-300 p-3 rounded-2xl rounded-bl-none border border-[--color-border-default] animate-pulse">
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-3 border-t border-[--color-border-default] bg-[--color-bg-elevated]">
            <p className="text-zinc-500 text-xs mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-1">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(qp); handleSubmit(new Event('submit')); }}
                  className="px-2 py-1 bg-[--color-bg-input] border border-[--color-border-default] rounded text-[10px] text-zinc-300 hover:border-sky-500 hover:text-white transition-colors"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[--color-border-default] bg-[--color-bg-elevated]">
            <div className="flex items-end space-x-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the behavior, dialogue, or cinematic you want..."
                rows={2}
                className="flex-1 bg-[--color-bg-input] border border-[--color-border-default] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 resize-none"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isProcessing}
                className="p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
                title="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};