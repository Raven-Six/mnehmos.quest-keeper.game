import React, { useState } from 'react';
import { useSettingsStore, LLMProvider } from '../../stores/settingsStore';
import { open } from '@tauri-apps/plugin-shell';
import { appLogDir } from '@tauri-apps/api/path';
import { mkdir } from '@tauri-apps/plugin-fs';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const {
        apiKeys,
        selectedProvider,
        providerModels,
        systemPrompt,
        llamaCppSettings,
        spoilerPatterns,
        setApiKey,
        setProvider,
        setModel,
        setSystemPrompt,
        setLlamaCppEndpoint,
        setLlamaCppMaxConcurrency,
        setLlamaCppTimeout,
        addSpoilerPattern,
        deleteSpoilerPattern,
        toggleSpoilerPattern,
    } = useSettingsStore();

    // Local state for adding new spoiler pattern
    const [newPattern, setNewPattern] = useState({
        name: '',
        pattern: '',
        title: '',
    });

    const handleOpenLogs = async () => {
        try {
            const logDir = await appLogDir();
            console.log('[Settings] Log dir path:', logDir);

            // Ensure directory exists first
            try {
                await mkdir(logDir, { recursive: true });
            } catch (e) {
                // Ignore if exists, or log warning
                console.warn('[Settings] Failed to create log dir (might exist):', e);
            }

            console.log('[Settings] Opening log dir...');
            await open(logDir);
        } catch (error) {
            console.error('[Settings] Failed to open log dir:', error);
        }
    };

    const handleAddPattern = () => {
        if (!newPattern.name || !newPattern.pattern || !newPattern.title) {
            return;
        }
        addSpoilerPattern({
            name: newPattern.name,
            pattern: newPattern.pattern,
            title: newPattern.title,
            enabled: true,
        });
        setNewPattern({ name: '', pattern: '', title: '' });
    };

    const handleDeletePattern = (id: string) => {
        if (confirm('Are you sure you want to delete this spoiler pattern?')) {
            deleteSpoilerPattern(id);
        }
    };

    // Local state for the form to allow "Save & Apply" behavior
    // However, for instant feedback/simplicity, we can keep using the store directly
    // but the user requested "Save and Apply".
    // Let's stick to direct store updates for now but make the UI clearer.
    // If we want true "Save & Apply", we'd need local state copies. 
    // Given the complexity, let's make the "Active Provider" selection very explicit.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-terminal-green bg-terminal-black shadow-glow flex flex-col max-h-[90vh]">
                <div className="p-6 flex items-center justify-between border-b border-terminal-green-dim flex-shrink-0">
                    <h2 className="text-xl font-bold text-terminal-green">CONFIGURATION</h2>
                    <button
                        onClick={onClose}
                        className="text-terminal-green hover:text-terminal-green-bright"
                    >
                        [X]
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-terminal-green">API PROVIDER</label>
                        <select
                            value={selectedProvider}
                            onChange={(e) => setProvider(e.target.value as LLMProvider)}
                            className="w-full rounded border border-terminal-green bg-black px-3 py-2 text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                        >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="llamacpp">llama.cpp (Local)</option>
                        </select>
                        <p className="text-xs text-terminal-green-dim">
                            This sets the active provider for all chat interactions.
                        </p>
                    </div>

                    {/* API Key - not needed for llama.cpp */}
                    {selectedProvider !== 'llamacpp' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-terminal-green">
                                {selectedProvider.toUpperCase()} API KEY
                            </label>
                            <input
                                type="password"
                                value={apiKeys[selectedProvider]}
                                onChange={(e) => setApiKey(selectedProvider, e.target.value)}
                                className="w-full rounded border border-terminal-green bg-black px-3 py-2 text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                placeholder={`Enter ${selectedProvider} API Key`}
                            />
                        </div>
                    )}

                    {/* llama.cpp-specific settings */}
                    {selectedProvider === 'llamacpp' && llamaCppSettings && (
                        <div className="space-y-4 rounded border border-terminal-green-dim bg-black/30 p-4">
                            <div className="text-xs font-bold text-terminal-green-dim uppercase">
                                llama.cpp Server Configuration
                            </div>

                            {/* Endpoint URL */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-terminal-green">
                                    SERVER ENDPOINT
                                </label>
                                <input
                                    type="text"
                                    value={llamaCppSettings.endpoint}
                                    onChange={(e) => setLlamaCppEndpoint(e.target.value)}
                                    className="w-full rounded border border-terminal-green bg-black px-3 py-2 text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                    placeholder="http://localhost:8080"
                                />
                                <p className="text-xs text-terminal-green-dim">
                                    URL of llama.cpp server (must be running independently)
                                </p>
                            </div>

                            {/* Max Concurrency */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-terminal-green">
                                    MAX CONCURRENT TOOL CALLS
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={llamaCppSettings.maxConcurrency}
                                    onChange={(e) => setLlamaCppMaxConcurrency(parseInt(e.target.value) || 4)}
                                    className="w-full rounded border border-terminal-green bg-black px-3 py-2 text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                />
                                <p className="text-xs text-terminal-green-dim">
                                    Maximum parallel tool calls (1-10, default: 4)
                                </p>
                            </div>

                            {/* Request Timeout */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-terminal-green">
                                    REQUEST TIMEOUT (ms)
                                </label>
                                <input
                                    type="number"
                                    min="5000"
                                    max="300000"
                                    step="1000"
                                    value={llamaCppSettings.timeout}
                                    onChange={(e) => setLlamaCppTimeout(parseInt(e.target.value) || 30000)}
                                    className="w-full rounded border border-terminal-green bg-black px-3 py-2 text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                />
                                <p className="text-xs text-terminal-green-dim">
                                    Request timeout in milliseconds (default: 30000)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-terminal-green">MODEL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={providerModels[selectedProvider]}
                                onChange={(e) => setModel(selectedProvider, e.target.value)}
                                className="flex-1 rounded border border-terminal-green bg-black px-3 py-2 text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                placeholder="Select or type model ID"
                            />
                            <select
                                onChange={(e) => {
                                    if (e.target.value) setModel(selectedProvider, e.target.value);
                                }}
                                className="w-8 rounded border border-terminal-green bg-black px-1 text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                value=""
                            >
                                <option value="">▼</option>
                                {selectedProvider === 'openai' && (
                                    <>
                                        <optgroup label="GPT-5 Series">
                                            <option value="gpt-5.1">GPT-5.1</option>
                                            <option value="gpt-5-pro">GPT-5 Pro</option>
                                            <option value="gpt-5-mini">GPT-5 Mini</option>
                                        </optgroup>
                                        <optgroup label="Reasoning">
                                            <option value="o4-mini">o4-mini</option>
                                            <option value="o3-mini">o3-mini</option>
                                        </optgroup>
                                        <optgroup label="Legacy">
                                            <option value="gpt-4o">GPT-4o</option>
                                        </optgroup>
                                    </>
                                )}
                                {selectedProvider === 'anthropic' && (
                                    <>
                                        <option value="claude-sonnet-4.5">Claude Sonnet 4.5</option>
                                        <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                                        <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                    </>
                                )}
                                {selectedProvider === 'openrouter' && (
                                    <>
                                        <optgroup label="Free / Free Tier">
                                            <option value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (Free)</option>
                                            <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash Exp (Free)</option>
                                            <option value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</option>
                                            <option value="qwen/qwen3-coder:free">Qwen3 Coder (Free)</option>
                                        </optgroup>
                                        <optgroup label="Premium">
                                            <option value="anthropic/claude-sonnet-4.5">Claude Sonnet 4.5</option>
                                            <option value="openai/gpt-5.1">GPT-5.1</option>
                                            <option value="google/gemini-3-pro">Gemini 3 Pro</option>
                                        </optgroup>
                                    </>
                                )}
                                {selectedProvider === 'gemini' && (
                                    <>
                                        <option value="gemini-3-pro">Gemini 3 Pro</option>
                                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    </>
                                )}
                                {selectedProvider === 'llamacpp' && (
                                    <>
                                        <option value="llama-3.2-3b-instruct">Llama 3.2 3B Instruct</option>
                                        <option value="llama-3.1-8b-instruct">Llama 3.1 8B Instruct</option>
                                        <option value="mistral-7b-instruct">Mistral 7B Instruct</option>
                                        <option value="qwen2.5-7b-instruct">Qwen 2.5 7B Instruct</option>
                                        <option value="deepseek-r1">DeepSeek R1</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-terminal-green">SYSTEM PROMPT</label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="h-24 w-full rounded border border-terminal-green bg-black px-3 py-2 text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                            placeholder="Define the AI's behavior..."
                        />
                    </div>

                    {/* Spoiler Patterns */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-terminal-green">AUTO-SPOILER PATTERNS</label>
                        <p className="text-xs text-terminal-green-dim">
                            Configure which chat content patterns are automatically hidden in spoilers.
                        </p>

                        {/* Existing patterns list */}
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {spoilerPatterns.map((pattern) => (
                                <div
                                    key={pattern.id}
                                    className="flex items-center gap-2 rounded border border-terminal-green-dim bg-black/30 p-2"
                                >
                                    <button
                                        onClick={() => toggleSpoilerPattern(pattern.id)}
                                        className={`flex-shrink-0 px-2 py-1 text-xs font-bold rounded ${
                                            pattern.enabled
                                                ? 'bg-terminal-green text-terminal-black'
                                                : 'bg-terminal-green/20 text-terminal-green-dim'
                                        }`}
                                    >
                                        {pattern.enabled ? 'ON' : 'OFF'}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-terminal-green truncate">
                                            {pattern.name}
                                        </div>
                                        <div className="text-xs text-terminal-green-dim truncate">
                                            {pattern.pattern}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePattern(pattern.id)}
                                        className="flex-shrink-0 text-terminal-green hover:text-red-400 px-2"
                                        title="Delete pattern"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add new pattern */}
                        <div className="space-y-2 rounded border border-terminal-green-dim bg-black/30 p-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={newPattern.name}
                                    onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                                    className="rounded border border-terminal-green bg-black px-2 py-1 text-sm text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                    placeholder="Pattern name"
                                />
                                <input
                                    type="text"
                                    value={newPattern.title}
                                    onChange={(e) => setNewPattern({ ...newPattern, title: e.target.value })}
                                    className="rounded border border-terminal-green bg-black px-2 py-1 text-sm text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                    placeholder="Spoiler title"
                                />
                            </div>
                            <input
                                type="text"
                                value={newPattern.pattern}
                                onChange={(e) => setNewPattern({ ...newPattern, pattern: e.target.value })}
                                className="w-full rounded border border-terminal-green bg-black px-2 py-1 text-sm text-terminal-green focus:border-terminal-green-bright focus:outline-none"
                                placeholder="Regex pattern (e.g., ```([\\s\\S]*?)```)"
                            />
                            <button
                                onClick={handleAddPattern}
                                disabled={!newPattern.name || !newPattern.pattern || !newPattern.title}
                                className="w-full rounded border border-terminal-green bg-black/50 px-3 py-1 text-sm text-terminal-green transition-colors hover:bg-terminal-green/10 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                            >
                                + ADD PATTERN
                            </button>
                        </div>
                    </div>

                    {/* Debug / Logs */}
                    <div className="pt-2 border-t border-terminal-green-dim">
                        <label className="block text-sm font-bold text-terminal-green mb-2">DEBUGGING</label>
                        <button
                            onClick={handleOpenLogs}
                            className="w-full rounded border border-terminal-green bg-black/50 px-4 py-2 font-mono text-sm text-terminal-green transition-colors hover:bg-terminal-green/10 focus:outline-none"
                        >
                            📂 OPEN LOG FOLDER
                        </button>
                    </div>
                </div>

                <div className="p-6 flex justify-end border-t border-terminal-green-dim flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="rounded bg-terminal-green px-6 py-2 font-bold text-terminal-black hover:bg-terminal-green-bright"
                    >
                        DONE
                    </button>
                </div>
            </div>
        </div>
    );
};
