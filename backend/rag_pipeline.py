#!/usr/bin/env python3
"""Small dependency-free retrieval step used by the Express API."""
import json
import re
import sys


def chunks(text, size=900, overlap=120):
    words = re.findall(r"\S+", text)
    result = []
    start = 0
    while start < len(words):
        result.append(" ".join(words[start:start + size]))
        start += size - overlap
    return result


def score(chunk, query_terms):
    lowered = chunk.lower()
    return sum(lowered.count(term) for term in query_terms)


def main():
    payload = json.load(sys.stdin)
    text = payload.get("text", "")
    query = payload.get("query", "")
    query_terms = [term for term in re.findall(r"[a-zA-Z0-9]{3,}", query.lower())]
    ranked = sorted(chunks(text), key=lambda item: score(item, query_terms), reverse=True)
    json.dump({"context": ranked[:5], "chunkCount": len(ranked)}, sys.stdout)


if __name__ == "__main__":
    main()
