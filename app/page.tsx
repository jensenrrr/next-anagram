'use client';

import { useState } from 'react';

type AnagramResult = string[];

const TOP_N_OPTIONS = [
  { value: '', label: 'All words' },
  { value: '1000', label: '1,000 common words' },
  { value: '5000', label: '5,000 common words' },
  { value: '10000', label: '10,000 common words' },
  { value: '20000', label: '20,000 common words' },
];

const MAX_RESULTS_OPTIONS = ['50', '100', '200', '500', '1000'];

export default function Home() {
  const [phrase, setPhrase] = useState('');
  const [topN, setTopN] = useState('');
  const [maxResults, setMaxResults] = useState('50');
  const [focusedWords, setFocusedWords] = useState<string[]>([]);
  const [removedWords, setRemovedWords] = useState<string[]>([]);
  const [manualFocus, setManualFocus] = useState('');
  const [anagrams, setAnagrams] = useState<AnagramResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFind = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        phrase,
        with: focusedWords.join(' '),
        without: removedWords.join(' '),
        top_n: topN,
        max_results: maxResults,
      });
      const response = await fetch(`/api/anagrams?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch anagrams');
      const data = await response.json();
      setAnagrams(data);
    } catch (err: any) {
      setError(err.message);
      setAnagrams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhrase('');
    setFocusedWords([]);
    setRemovedWords([]);
    setManualFocus('');
    setAnagrams([]);
    setError(null);
  };

  const handleAddFocus = () => {
    const word = manualFocus.trim().toLowerCase();
    if (word && !focusedWords.includes(word)) {
      const newFocused = [...focusedWords, word];
      setFocusedWords(newFocused);
      setManualFocus('');
    }
  };

  const handleFocusWord = (word: string) => {
    if (!focusedWords.includes(word)) {
      const newFocused = [...focusedWords, word];
      setFocusedWords(newFocused);
    }
  };

  const handleRemoveWord = (word: string) => {
    if (!removedWords.includes(word)) {
      const newRemoved = [...removedWords, word];
      setRemovedWords(newRemoved);
    }
  };

  const handleCopy = (anagram: string[]) => {
    navigator.clipboard.writeText(anagram.join(' '));
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Anagram Finder</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="Phrase to anagram"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="top_n" className="text-sm font-medium text-gray-700">
                  Use top:
                </label>
                <select
                  id="top_n"
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TOP_N_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label htmlFor="max_results" className="text-sm font-medium text-gray-700">
                  Max Results:
                </label>
                <select
                  id="max_results"
                  value={maxResults}
                  onChange={(e) => setMaxResults(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {MAX_RESULTS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleFind}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Finding...' : 'Find anagrams'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-3">
            <div>
              <strong className="text-gray-700">Focused words:</strong>
              <span className="ml-2 text-gray-900">{focusedWords.join(', ') || '(none)'}</span>
            </div>
            <div>
              <strong className="text-gray-700">Removed words:</strong>
              <span className="ml-2 text-gray-900">{removedWords.join(', ') || '(none)'}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualFocus}
                onChange={(e) => setManualFocus(e.target.value)}
                placeholder="Add word to focus"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFocus();
                  }
                }}
              />
              <button
                onClick={handleAddFocus}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add Focus
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading...</div>
          ) : (
            anagrams.map((anagram, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-2 flex-wrap items-center">
                  {anagram.map((word, wordIdx) => (
                    <div key={wordIdx} className="flex items-center gap-1">
                      <button
                        onClick={() => handleFocusWord(word)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title="Focus on this word"
                      >
                        +
                      </button>
                      <span className="font-medium text-gray-900">{word}</span>
                      <button
                        onClick={() => handleRemoveWord(word)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        title="Remove this word"
                      >
                        -
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleCopy(anagram)}
                  className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
