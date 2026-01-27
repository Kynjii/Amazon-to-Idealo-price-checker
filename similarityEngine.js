const cosine = {
    similarity: function (s1, s2) {
        if (typeof s1 !== "string" || typeof s2 !== "string") {
            throw new Error("Both parameters must be strings");
        }

        if (!s1.length && !s2.length) return 1;
        if (!s1.length || !s2.length) return 0;
        if (s1 === s2) return 1;

        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        const words1 = s1.split(/\s+/);
        const words2 = s2.split(/\s+/);
        const allWords = Array.from(new Set([...words1, ...words2]));

        const vec1 = allWords.map((word) => words1.filter((w) => w === word).length);
        const vec2 = allWords.map((word) => words2.filter((w) => w === word).length);

        const dotProduct = vec1.reduce((acc, cur, i) => acc + cur * vec2[i], 0);
        const magnitude1 = Math.sqrt(vec1.reduce((acc, cur) => acc + cur ** 2, 0));
        const magnitude2 = Math.sqrt(vec2.reduce((acc, cur) => acc + cur ** 2, 0));

        return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
    },

    findBestMatch: function (target, candidates) {
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
