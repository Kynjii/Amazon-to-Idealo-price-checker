const cosine = {
    similarity: function (s1, s2) {
        if (typeof s1 !== "string" || typeof s2 !== "string") {
            throw new Error("Both parameters must be strings");
        }

        if (!s1.length && !s2.length) return 1;
        if (!s1.length || !s2.length) return 0;
        if (s1 === s2) return 1;

        const terms = Array.from(new Set([...s1.split(""), ...s2.split("")]));
        const vec1 = terms.map((term) => s1.split(term).length - 1);
        const vec2 = terms.map((term) => s2.split(term).length - 1);

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
