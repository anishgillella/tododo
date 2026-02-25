import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialogueHistory, useSendMessage } from '../hooks/useDialogue';
import { useAgent } from '../hooks/useAgent';
import { useSettings } from '../hooks/useSettings';

const CHARACTERS = [
  { id: 'axiom', name: 'AXIOM', icon: '\u{1F916}', color: 'text-drift', borderColor: 'border-drift', bgActive: 'bg-drift/10' },
  { id: 'kael', name: 'Kael', icon: '\u{2694}\u{FE0F}', color: 'text-ember', borderColor: 'border-ember', bgActive: 'bg-ember/10' },
  { id: 'mira', name: 'Mira', icon: '\u{1F33F}', color: 'text-verdant', borderColor: 'border-verdant', bgActive: 'bg-verdant/10' },
  { id: 'the-hollow', name: 'The Hollow', icon: '\u{1F441}\u{FE0F}', color: 'text-rift', borderColor: 'border-rift', bgActive: 'bg-rift/10' },
] as const;

function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${color === 'text-drift' ? 'bg-drift' : color === 'text-ember' ? 'bg-ember' : color === 'text-verdant' ? 'bg-verdant' : 'bg-rift'}`}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export function Tavern() {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('axiom');
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: agent } = useAgent();
  const { data: settings } = useSettings();
  const { data: messages = [], isLoading: historyLoading } = useDialogueHistory(selectedCharacter);
  const sendMessage = useSendMessage();

  const activeChar = CHARACTERS.find((c) => c.id === selectedCharacter) ?? CHARACTERS[0];

  // Only show The Hollow if debt > 0
  const visibleCharacters = CHARACTERS.filter(
    (c) => c.id !== 'the-hollow' || (agent && agent.debt > 0),
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMessage.isPending]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || sendMessage.isPending) return;

    sendMessage.mutate(
      { character: selectedCharacter, message: trimmed },
    );
    setInputValue('');
  }, [inputValue, selectedCharacter, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex h-screen flex-col px-4 pt-6 pb-4"
    >
      {/* Header */}
      <header className="mb-4 shrink-0">
        <h1 className="font-display text-2xl font-bold tracking-widest text-parchment uppercase">
          The Tavern
        </h1>
        <p className="mt-1 font-mono text-sm tracking-wide text-ash">
          // Speak with the crew
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-ember via-steel to-transparent" />
      </header>

      {/* API Key Notice */}
      {settings && !settings.hasApiKey && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 shrink-0 rounded-lg border border-ember/30 bg-ember/5 px-4 py-2.5"
        >
          <p className="text-xs text-ember-light">
            Set your OpenRouter API key in{' '}
            <Link to="/settings" className="underline underline-offset-2 hover:text-ember">
              Settings
            </Link>{' '}
            to enable AI dialogue. Fallback responses active.
          </p>
        </motion.div>
      )}

      {/* Character Selector */}
      <div className="mb-4 flex shrink-0 gap-2">
        {visibleCharacters.map((char) => {
          const isActive = selectedCharacter === char.id;
          return (
            <motion.button
              key={char.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedCharacter(char.id);
                inputRef.current?.focus();
              }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                isActive
                  ? `${char.borderColor} ${char.bgActive}`
                  : 'border-steel bg-void-lighter hover:border-steel-light'
              }`}
            >
              <span className="text-lg">{char.icon}</span>
              <span
                className={`font-display text-xs tracking-wider uppercase ${
                  isActive ? char.color : 'text-ash'
                }`}
              >
                {char.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Chat Area */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-steel bg-void-light">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {historyLoading ? (
            <div className="flex h-full items-center justify-center">
              <p className="font-mono text-xs text-steel-light">Loading transmission logs...</p>
            </div>
          ) : messages.length === 0 && !sendMessage.isPending ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="text-4xl">{activeChar.icon}</span>
              <p className={`font-display text-sm tracking-wider uppercase ${activeChar.color}`}>
                {activeChar.name} awaits
              </p>
              <p className="max-w-xs text-xs text-ash">
                Begin a conversation. Your words shape the story.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' ? (
                      <div className="max-w-[80%] rounded-xl bg-steel px-4 py-2.5">
                        <p className="text-sm leading-relaxed text-parchment">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[80%] rounded-xl border border-steel bg-void-lighter px-4 py-2.5">
                        <p className={`mb-1 font-display text-[10px] tracking-widest uppercase ${activeChar.color}`}>
                          {activeChar.icon} {activeChar.name}
                        </p>
                        <p className="text-sm leading-relaxed text-bone">{msg.content}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {sendMessage.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="rounded-xl border border-steel bg-void-lighter px-4 py-3">
                    <p className={`mb-1.5 font-display text-[10px] tracking-widest uppercase ${activeChar.color}`}>
                      {activeChar.icon} {activeChar.name}
                    </p>
                    <TypingIndicator color={activeChar.color} />
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="shrink-0 border-t border-steel bg-void-light px-3 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Speak to ${activeChar.name}...`}
              disabled={sendMessage.isPending}
              className="flex-1 rounded-lg border border-steel bg-void px-4 py-2.5 text-sm text-parchment placeholder:text-steel-light focus:border-arcane focus:outline-none disabled:opacity-50"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!inputValue.trim() || sendMessage.isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-arcane bg-arcane/10 text-arcane-light transition-colors hover:bg-arcane/20 disabled:border-steel disabled:bg-transparent disabled:text-steel-light disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
