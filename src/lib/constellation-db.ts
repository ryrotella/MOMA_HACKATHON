import "server-only";

import path from "node:path";

import {
  normalizeText,
  type ArchiveArtworkCandidate,
  type CuratedArtwork,
} from "@/lib/constellation";

type SqliteDb = {
  prepare: (query: string) => SqliteStatement;
};

type SqliteStatement = {
  all: (...params: (string | number)[]) => unknown[];
};

const DB_PATH = path.join(process.cwd(), "_db_moma-collection", "moma_full.db");
const RELATED_LIMIT_PER_ANCHOR = 80;

let db: SqliteDb | null = null;
let artistStmt: SqliteStatement | null = null;
let departmentStmt: SqliteStatement | null = null;
let textStmt: SqliteStatement | null = null;
let eraStmt: SqliteStatement | null = null;
let fallbackStmt: SqliteStatement | null = null;

interface DbRow {
  ObjectID: number;
  Title: string;
  Artist: string;
  Date: string;
  Department: string;
  Classification: string;
  Medium: string;
  ImageURL: string | null;
  URL: string | null;
  OnView: string | null;
}

async function getDb(): Promise<SqliteDb> {
  if (db) {
    return db;
  }

  const sqliteModule = (await import("node:sqlite")) as unknown as {
    DatabaseSync: new (filePath: string, options: { readOnly: boolean }) => SqliteDb;
  };
  db = new sqliteModule.DatabaseSync(DB_PATH, { readOnly: true });
  return db;
}

async function ensurePreparedStatements() {
  const sqlite = await getDb();

  if (!artistStmt) {
    artistStmt = sqlite.prepare(`
      SELECT ObjectID, Title, Artist, Date, Department, Classification, Medium, ImageURL, URL, OnView
      FROM artworks
      WHERE lower(Artist) = lower(?)
      LIMIT ?
    `);
  }

  if (!departmentStmt) {
    departmentStmt = sqlite.prepare(`
      SELECT ObjectID, Title, Artist, Date, Department, Classification, Medium, ImageURL, URL, OnView
      FROM artworks
      WHERE lower(Department) = lower(?)
      LIMIT ?
    `);
  }

  if (!textStmt) {
    textStmt = sqlite.prepare(`
      SELECT ObjectID, Title, Artist, Date, Department, Classification, Medium, ImageURL, URL, OnView
      FROM artworks
      WHERE lower(Classification) LIKE lower(?) OR lower(Medium) LIKE lower(?) OR lower(Title) LIKE lower(?)
      LIMIT ?
    `);
  }

  if (!eraStmt) {
    eraStmt = sqlite.prepare(`
      SELECT ObjectID, Title, Artist, Date, Department, Classification, Medium, ImageURL, URL, OnView
      FROM artworks
      WHERE BeginDate >= ? AND BeginDate <= ?
      LIMIT ?
    `);
  }

  if (!fallbackStmt) {
    fallbackStmt = sqlite.prepare(`
      SELECT ObjectID, Title, Artist, Date, Department, Classification, Medium, ImageURL, URL, OnView
      FROM artworks
      WHERE lower(Department) = lower(?)
      LIMIT ?
    `);
  }
}

function mapRow(row: DbRow): ArchiveArtworkCandidate {
  const fullImageUrl = row.ImageURL || null;
  const thumbnailUrl = fullImageUrl;
  return {
    objectId: row.ObjectID,
    title: row.Title || "",
    artist: row.Artist || "",
    date: row.Date || "",
    department: row.Department || "",
    classification: row.Classification || "",
    medium: row.Medium || "",
    thumbnailUrl,
    fullImageUrl,
    momaUrl: row.URL,
    onViewText: row.OnView,
  };
}

function toDistinctCandidates(rows: DbRow[], excludeByKey: Set<string>): ArchiveArtworkCandidate[] {
  const output: ArchiveArtworkCandidate[] = [];
  const seen = new Set<number>();

  for (const row of rows) {
    if (seen.has(row.ObjectID)) {
      continue;
    }
    seen.add(row.ObjectID);

    const titleKey = normalizeText(row.Title);
    const artistKey = normalizeText(row.Artist);
    const dedupeKey = `${artistKey}|${titleKey}`;
    if (excludeByKey.has(dedupeKey)) {
      continue;
    }
    output.push(mapRow(row));
  }

  return output;
}

function quoteLike(input: string): string {
  return `%${input.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
}

export async function fetchCandidatePool(
  anchor: CuratedArtwork,
  excludeByKey: Set<string>
): Promise<ArchiveArtworkCandidate[]> {
  await ensurePreparedStatements();

  const rows: DbRow[] = [];
  const tagHints = anchor.tags.map((tag) => normalizeText(tag).replace(/-/g, " ")).filter(Boolean);
  const anchorYear = Number.parseInt((anchor.year.match(/\d{4}/) || [])[0] ?? "", 10);

  if (artistStmt && normalizeText(anchor.artist)) {
    rows.push(...(artistStmt.all(anchor.artist, RELATED_LIMIT_PER_ANCHOR) as DbRow[]));
  }

  if (departmentStmt && normalizeText(anchor.department)) {
    rows.push(...(departmentStmt.all(anchor.department, Math.floor(RELATED_LIMIT_PER_ANCHOR * 0.5)) as DbRow[]));
  }

  if (textStmt) {
    for (const hint of tagHints.slice(0, 5)) {
      const token = quoteLike(hint);
      rows.push(...(textStmt.all(token, token, token, Math.floor(RELATED_LIMIT_PER_ANCHOR * 0.25)) as DbRow[]));
    }
  }

  if (eraStmt && Number.isFinite(anchorYear)) {
    rows.push(
      ...(eraStmt.all(String(anchorYear - 20), String(anchorYear + 20), Math.floor(RELATED_LIMIT_PER_ANCHOR * 0.25)) as DbRow[])
    );
  }

  if (rows.length < 30 && fallbackStmt) {
    rows.push(...(fallbackStmt.all(anchor.department, RELATED_LIMIT_PER_ANCHOR) as DbRow[]));
  }

  return toDistinctCandidates(rows, excludeByKey).slice(0, RELATED_LIMIT_PER_ANCHOR);
}
