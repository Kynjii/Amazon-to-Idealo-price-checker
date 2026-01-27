/**
 * Text similarity calculation engine
 * @fileoverview Provides cosine similarity algorithm using the string-comparison library
 */

// Import the string-comparison library that's already in dependencies
// Note: In a Chrome extension, we'd need to bundle this properly, but for now using the existing manual implementation
// TODO: Set up proper build process to use the string-comparison npm package

/**
 * Cosine similarity calculation object
 * Uses the existing string-comparison library pattern but implemented inline for Chrome extension compatibility
 */
const cosine = {
    /**
     * Calculates cosine similarity between two strings using character-level vectorization
     * @param {string} s1 - First string to compare
     * @param {string} s2 - Second string to compare
     * @returns {number} - Similarity score between 0 and 1 (1 being identical)
     */
    similarity: function (s1, s2) {
        // Input validation
        if (typeof s1 !== 'string' || typeof s2 !== 'string') {
            throw new Error('Both parameters must be strings');
        }

        // Handle edge cases
        if (!s1.length && !s2.length) return 1;
        if (!s1.length || !s2.length) return 0;
        if (s1 === s2) return 1;

        // Create character frequency vectors
        const terms = Array.from(new Set([...s1.split(""), ...s2.split("")]));
        const vec1 = terms.map((term) => s1.split(term).length - 1);
        const vec2 = terms.map((term) => s2.split(term).length - 1);

        // Calculate cosine similarity
        const dotProduct = vec1.reduce((acc, cur, i) => acc + cur * vec2[i], 0);
        const magnitude1 = Math.sqrt(vec1.reduce((acc, cur) => acc + cur ** 2, 0));
        const magnitude2 = Math.sqrt(vec2.reduce((acc, cur) => acc + cur ** 2, 0));

        return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
    },

    /**
     * Finds the best matching string from an array of candidates
     * @param {string} target - String to match against
     * @param {Array<string>} candidates - Array of candidate strings
     * @returns {Object} - Object with {match: string, score: number, index: number}
     */
    findBestMatch: function(target, candidates) {
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return { match: null, score: 0, index: -1 };
        }

        let bestMatch = { match: candidates[0], score: 0, index: 0 };

        candidates.forEach((candidate, index) => {
            const score = this.similarity(target, candidate);
            if (score > bestMatch.score) {
                bestMatch = { match: candidate, score, index };
            }
        });

        return bestMatch;
    }
};
