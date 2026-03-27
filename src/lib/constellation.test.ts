import test from "node:test";
import assert from "node:assert/strict";

import {
  eraProximityScore,
  extractYear,
  scoreRelatedArtwork,
  type ArchiveArtworkCandidate,
  type CuratedArtwork,
} from "./constellation.ts";

const anchor: CuratedArtwork = {
  id: "starry-night",
  title: "The Starry Night",
  artist: "Vincent van Gogh",
  year: "1889",
  medium: "Oil on canvas",
  dimensions: "29 x 36 1/4",
  gallery: "501",
  floor: 5,
  department: "Painting & Sculpture",
  classification: "Painting",
  thumbnail: "",
  description: "",
  tags: ["post-impressionism", "landscape", "iconic"],
  popularity: 100,
};

function candidate(overrides: Partial<ArchiveArtworkCandidate>): ArchiveArtworkCandidate {
  return {
    objectId: 1,
    title: "Untitled",
    artist: "Unknown",
    date: "1900",
    department: "Painting & Sculpture",
    classification: "Painting",
    medium: "Oil on canvas",
    thumbnailUrl: null,
    fullImageUrl: null,
    momaUrl: null,
    onViewText: null,
    ...overrides,
  };
}

test("artist match dominates score", () => {
  const sameArtist = scoreRelatedArtwork(anchor, candidate({ objectId: 2, artist: "Vincent van Gogh", date: "1888" }));
  const noArtist = scoreRelatedArtwork(anchor, candidate({ objectId: 3, artist: "Paul Klee", date: "1888" }));
  assert.ok(sameArtist.score > noArtist.score);
  assert.equal(sameArtist.reasons.includes("same_artist"), true);
});

test("mixed weighting combines multiple criteria", () => {
  const result = scoreRelatedArtwork(
    anchor,
    candidate({
      objectId: 4,
      artist: "Vincent van Gogh",
      classification: "Post Impressionism Painting",
      medium: "Landscape oil",
      department: "Painting & Sculpture",
      date: "1895",
    })
  );
  assert.ok(result.score > 0.7);
  assert.ok(result.reasons.includes("same_artist"));
  assert.ok(result.reasons.includes("same_department"));
  assert.ok(result.reasons.some((reason) => reason.startsWith("era_")));
});

test("era parsing and scoring handles malformed dates safely", () => {
  assert.equal(extractYear("c. 1890/91"), 1890);
  assert.equal(extractYear("not-a-date"), null);
  assert.equal(eraProximityScore(null, 1900), 0);
  assert.equal(eraProximityScore(1890, null), 0);
  assert.equal(eraProximityScore(1890, 1945), 0);
  assert.ok(eraProximityScore(1890, 1895) > eraProximityScore(1890, 1908));
});
