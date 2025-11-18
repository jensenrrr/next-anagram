import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface DictionaryOptions {
  without: string[];
  topN?: number;
}

class Dictionary {
  private words: string[][];

  constructor(options: DictionaryOptions) {
    const { without, topN } = options;
    let dictpath = path.join(process.cwd(), 'words.txt');

    // If topN is specified, use the common words file instead
    if (topN && topN > 0) {
      const commonWordsFile = path.join(process.cwd(), `common_words_${topN}.txt`);
      if (fs.existsSync(commonWordsFile)) {
        dictpath = commonWordsFile;
      }
    }

    this.words = [];
    try {
      const content = fs.readFileSync(dictpath, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const word = line.trim().toLowerCase();
        if (this.isValidWord(word, without)) {
          this.words.push(word.split(''));
        }
      }
    } catch (error) {
      console.error('Error loading dictionary:', error);
    }

    // Sort by length (longest first) and remove duplicates
    this.words.sort((a, b) => b.length - a.length);
    const seen = new Set<string>();
    const uniqueWords: string[][] = [];
    
    for (const word of this.words) {
      const wordStr = word.join('');
      if (!seen.has(wordStr)) {
        seen.add(wordStr);
        uniqueWords.push(word);
      }
    }
    this.words = uniqueWords;
  }

  private isValidWord(word: string, without: string[]): boolean {
    if (without.includes(word)) {
      return false;
    }
    if (word.length === 1 && !['a', 'i'].includes(word)) {
      return false;
    }
    if (!/[aeiouy]/.test(word)) {
      return false;
    }
    return true;
  }

  findAnagram(string: string, withWords: string[] = [], limit: number = 200): string[][] {
    const letters = string.toLowerCase().split('').filter(c => /[a-z]/.test(c));
    const withChars = withWords.filter(w => w).map(w => w.toLowerCase().split(''));

    // Remove letters used by "with" words
    let remainingLetters = letters;
    for (const wordChars of withChars) {
      const result = this.remnant(remainingLetters, wordChars);
      if (result === null) {
        return [];
      }
      remainingLetters = result;
    }

    const results: string[][] = [];
    this.expand(withChars, remainingLetters, this.words, limit, results);
    return results;
  }

  private expand(
    already: string[][],
    letters: string[],
    words: string[][],
    limit: number,
    results: string[][]
  ): void {
    if (results.length >= limit) {
      return;
    }
    if (words.length === 0) {
      return;
    }

    const pairs: Array<{ rem: string[]; word: string[] }> = [];
    
    for (const word of words) {
      const rem = this.remnant(letters, word);
      if (rem !== null) {
        if (rem.length === 0) {
          // Empty remainder - complete anagram
          const result = [...already, word]
            .map(w => w.join(''))
            .sort();
          
          // Check if this result already exists
          const exists = results.some(r => 
            r.length === result.length && 
            r.every((val, idx) => val === result[idx])
          );
          
          if (!exists) {
            results.push(result);
          }
        } else {
          pairs.push({ rem, word });
        }
      }
    }

    // Shuffle pairs for variety
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    const wrds = pairs.map(p => p.word);

    for (const { rem: lett, word } of pairs) {
      if (results.length >= limit) {
        break;
      }
      this.expand([...already, word], lett, wrds, limit, results);
    }
  }

  private remnant(letters: string[], word: string[]): string[] | null {
    const lettersCopy = [...letters];
    
    for (const c of word) {
      const idx = lettersCopy.indexOf(c);
      if (idx === -1) {
        return null;
      }
      lettersCopy.splice(idx, 1);
    }
    
    return lettersCopy;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const phrase = searchParams.get('phrase') || '';
  const withParam = searchParams.get('with') || '';
  const withoutParam = searchParams.get('without') || '';
  const topNParam = searchParams.get('top_n') || '';
  const maxResultsParam = searchParams.get('max_results') || '200';

  const withWords = withParam ? withParam.split(' ').filter(w => w) : [];
  const withoutWords = withoutParam ? withoutParam.split(' ').filter(w => w) : [];
  const topN = topNParam ? parseInt(topNParam, 10) : undefined;
  const maxResults = maxResultsParam ? parseInt(maxResultsParam, 10) : 200;

  try {
    const dictionary = new Dictionary({ without: withoutWords, topN });
    const results = dictionary.findAnagram(phrase, withWords, maxResults);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error finding anagrams:', error);
    return NextResponse.json({ error: 'Failed to find anagrams' }, { status: 500 });
  }
}
