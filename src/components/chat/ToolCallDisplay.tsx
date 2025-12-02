import React, { useCallback, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { formatToolResponse } from '../../utils/toolResponseFormatter';
import { CensorBlock } from './CensorBlock';

interface ToolCallDisplayProps {
    toolName: string;
    serverName?: string;
    arguments: Record<string, any>;
    response?: string;
    status: 'pending' | 'completed' | 'error';
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({
    toolName,
    serverName,
    arguments: args,
    response,
    status,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showArgs, setShowArgs] = useState(false);
    const [showResponse, setShowResponse] = useState(true);
    const remarkPlugins = useMemo(() => [remarkGfm], []);
    const rehypePlugins = useMemo(() => [rehypeHighlight], []);

    const formattedResponse = useMemo(() => {
        if (!response) return '';

        try {
            // Use the beautiful formatter
            const formatted = formatToolResponse(toolName, response);
            return formatted;
        } catch (e) {
            // Fallback to original parsing
            try {
                const parsed = JSON.parse(response);
                let content = '';
                
                if (parsed.content && Array.isArray(parsed.content)) {
                    content = parsed.content
                        .map((c: any) => c.type === 'text' ? c.text : '')
                        .join('\n');
                } else {
                    content = JSON.stringify(parsed, null, 2);
                }

                return content.replace(/\uFFFD/g, '=');
            } catch (e2) {
                return response.replace(/\uFFFD/g, '=');
            }
        }
    }, [response, toolName]);

    const segments = useMemo(() => {
        if (!formattedResponse) return [];

        const matches = [...formattedResponse.matchAll(/\[censor\]([\s\S]*?)\[\/censor\]/gi)];
        if (matches.length === 0) return [{ type: 'text', value: formattedResponse }];

        const parts: Array<{ type: 'text' | 'censor'; value: string }> = [];
        let lastIndex = 0;

        matches.forEach((match) => {
            const matchText = match[0];
            const spoilerContent = match[1];
            const startIndex = match.index ?? 0;

            if (startIndex > lastIndex) {
                parts.push({ type: 'text', value: formattedResponse.slice(lastIndex, startIndex) });
            }

            parts.push({ type: 'censor', value: spoilerContent });
            lastIndex = startIndex + matchText.length;
        });

        if (lastIndex < formattedResponse.length) {
            parts.push({ type: 'text', value: formattedResponse.slice(lastIndex) });
        }

        return parts.filter(part => part.value.trim() !== '' || part.type === 'censor');
    }, [formattedResponse]);

    const renderMarkdown = useCallback(
        (content: string) => (
            <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
            >
                {content}
            </ReactMarkdown>
        ),
        [remarkPlugins, rehypePlugins]
    );

    const statusColors = {
        pending: 'text-terminal-amber',
        completed: 'text-terminal-green',
        error: 'text-red-500',
    };

    const statusIcons = {
        pending: '⏳',
        completed: '✓',
        error: '✗',
    };

    return (
        <div className="border border-terminal-green-dim rounded bg-terminal-black/50 mb-2">
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-terminal-green/5 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <span className="codicon codicon-server text-terminal-green" />
                    <span className="text-terminal-green font-bold">
                        {serverName || 'MCP Tool'}
                    </span>
                    <span className="text-terminal-green/70 text-sm">→ {toolName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs uppercase tracking-wider ${statusColors[status]}`}>
                        {statusIcons[status]} {status}
                    </span>
                    <span className={`codicon codicon-chevron-${isExpanded ? 'down' : 'right'} text-terminal-green/50`} />
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t border-terminal-green-dim">
                    {/* Tool Call Arguments */}
                    <div className="p-3 border-b border-terminal-green-dim/50">
                        <div
                            className="flex items-center gap-2 cursor-pointer hover:text-terminal-amber transition-colors mb-2"
                            onClick={() => setShowArgs(!showArgs)}
                        >
                            <span className={`codicon codicon-chevron-${showArgs ? 'down' : 'right'} text-xs`} />
                            <span className="text-sm font-bold uppercase tracking-wider text-terminal-cyan">
                                Call Arguments
                            </span>
                        </div>
                        {showArgs && (
                            <div className="ml-4 mt-2">
                                <pre className="bg-terminal-black border border-terminal-green-dim rounded p-2 text-xs overflow-x-auto">
                                    <code className="text-terminal-green">
                                        {JSON.stringify(args, null, 2)}
                                    </code>
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Tool Response */}
                    {response && (
                        <div className="p-3">
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:text-terminal-amber transition-colors mb-2"
                                onClick={() => setShowResponse(!showResponse)}
                            >
                                <span className={`codicon codicon-chevron-${showResponse ? 'down' : 'right'} text-xs`} />
                                <span className="text-sm font-bold uppercase tracking-wider text-terminal-green">
                                    Response
                                </span>
                            </div>
                            {showResponse && (
                                <div className="ml-4 mt-2 space-y-3">
                                    {segments.map((segment, index) =>
                                        segment.type === 'censor' ? (
                                            <CensorBlock
                                                key={`censor-${index}`}
                                                content={segment.value}
                                                renderMarkdown={renderMarkdown}
                                            />
                                        ) : (
                                            <div
                                                key={`md-${index}`}
                                                className="markdown-content prose prose-invert prose-sm max-w-none"
                                            >
                                                {renderMarkdown(segment.value)}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
