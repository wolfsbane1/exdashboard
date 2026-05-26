import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import MaximizeControl from './MaximizeControl';

interface ApiEndpointCardProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  sampleRequest?: string;
  sampleResponse: string;
  notes?: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-red-100 text-red-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
};

export const ApiEndpointCard: React.FC<ApiEndpointCardProps> = ({
  method, path, description, sampleRequest, sampleResponse, notes,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
    >
      <div className="absolute right-11 top-3 z-10">
        <MaximizeControl
          title={`${method} ${path}`}
          className="h-8 w-8"
          contentClassName="min-h-[68vh]"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${methodColors[method]}`}>
                {method}
              </span>
              <code className="text-sm font-mono text-gray-800">{path}</code>
            </div>
            <p className="text-sm text-gray-600">{description}</p>

            {sampleRequest && (
              <div>
                <span className="mb-1 block text-xs font-medium text-gray-500 uppercase">Sample Request</span>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  {sampleRequest}
                </pre>
              </div>
            )}

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase">Sample Response</span>
                <button
                  onClick={() => handleCopy(sampleResponse)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Copy size={12} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-[56vh] overflow-auto rounded-lg bg-gray-900 p-4 font-mono text-xs text-gray-100">
                {sampleResponse}
              </pre>
            </div>

            {notes && (
              <p className="text-xs text-gray-400 italic">{notes}</p>
            )}
          </div>
        </MaximizeControl>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${methodColors[method]}`}>
            {method}
          </span>
          <code className="text-sm font-mono text-gray-800">{path}</code>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden md:inline">{description}</span>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-600">{description}</p>

              {sampleRequest && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">Sample Request</span>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    {sampleRequest}
                  </pre>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase">Sample Response</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(sampleResponse); }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Copy size={12} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  {sampleResponse}
                </pre>
              </div>

              {notes && (
                <p className="text-xs text-gray-400 italic">{notes}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
