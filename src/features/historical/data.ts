import wc1954 from "../../data/historical/1954.json";
import wc1958 from "../../data/historical/1958.json";
import wc1962 from "../../data/historical/1962.json";
import wc1966 from "../../data/historical/1966.json";
import wc1970 from "../../data/historical/1970.json";
import wc1982 from "../../data/historical/1982.json";
import wc1986 from "../../data/historical/1986.json";
import wc1990 from "../../data/historical/1990.json";
import wc1994 from "../../data/historical/1994.json";
import wc1998 from "../../data/historical/1998.json";
import wc2002 from "../../data/historical/2002.json";
import wc2006 from "../../data/historical/2006.json";
import wc2010 from "../../data/historical/2010.json";
import wc2014 from "../../data/historical/2014.json";
import wc2018 from "../../data/historical/2018.json";
import wc2022 from "../../data/historical/2022.json";

export type HistoricalRound = "R16" | "QF" | "SF" | "3RD" | "F";

export type HistoricalMatch = {
  round: HistoricalRound;
  date: string | null;
  time: string | null;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  extraTime: boolean;
  penaltyA: number | null;
  penaltyB: number | null;
  venue: string | null;
};

export type HistoricalTournament = {
  year: number;
  source: string;
  scrapedAt: string;
  matches: HistoricalMatch[];
};

/** Years we have scraped data for. Add a new entry after running
 *  `node scripts/scrape-historical-wc.mjs <year>`. */
export const HISTORICAL_TOURNAMENTS: Record<number, HistoricalTournament> = {
  2022: wc2022 as HistoricalTournament,
  2018: wc2018 as HistoricalTournament,
  2014: wc2014 as HistoricalTournament,
  2010: wc2010 as HistoricalTournament,
  2006: wc2006 as HistoricalTournament,
  2002: wc2002 as HistoricalTournament,
  1998: wc1998 as HistoricalTournament,
  1994: wc1994 as HistoricalTournament,
  1990: wc1990 as HistoricalTournament,
  1986: wc1986 as HistoricalTournament,
  1982: wc1982 as HistoricalTournament,
  1970: wc1970 as HistoricalTournament,
  1966: wc1966 as HistoricalTournament,
  1962: wc1962 as HistoricalTournament,
  1958: wc1958 as HistoricalTournament,
  1954: wc1954 as HistoricalTournament,
};

export const HISTORICAL_YEARS: number[] = Object.keys(HISTORICAL_TOURNAMENTS)
  .map(Number)
  .sort((a, b) => b - a);

const ROUND_LABEL: Record<HistoricalRound, string> = {
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3RD": "Third-place match",
  F: "Final",
};

const ROUND_ORDER: HistoricalRound[] = ["R16", "QF", "SF", "3RD", "F"];

export function roundLabel(r: HistoricalRound): string {
  return ROUND_LABEL[r];
}

/** Group a tournament's matches by round, in bracket order. */
export function groupByRound(t: HistoricalTournament): Array<{ round: HistoricalRound; matches: HistoricalMatch[] }> {
  const bucket: Partial<Record<HistoricalRound, HistoricalMatch[]>> = {};
  for (const m of t.matches) {
    (bucket[m.round] ??= []).push(m);
  }
  return ROUND_ORDER.filter((r) => bucket[r]?.length).map((r) => ({
    round: r,
    matches: bucket[r]!,
  }));
}

/** Host country / countries for each supported year. Codes match
 *  Wikipedia's FIFA-broadcast three-letter conventions used elsewhere
 *  in the app, so the shared Flag component handles them without
 *  extra mapping. */
export const HISTORICAL_HOSTS: Record<number, Array<{ name: string; code: string }>> = {
  1954: [{ name: "Switzerland", code: "SUI" }],
  1958: [{ name: "Sweden", code: "SWE" }],
  1962: [{ name: "Chile", code: "CHI" }],
  1966: [{ name: "England", code: "ENG" }],
  1970: [{ name: "Mexico", code: "MEX" }],
  1982: [{ name: "Spain", code: "ESP" }],
  1986: [{ name: "Mexico", code: "MEX" }],
  1990: [{ name: "Italy", code: "ITA" }],
  1994: [{ name: "United States", code: "USA" }],
  1998: [{ name: "France", code: "FRA" }],
  2002: [
    { name: "South Korea", code: "KOR" },
    { name: "Japan", code: "JPN" },
  ],
  2006: [{ name: "Germany", code: "GER" }],
  2010: [{ name: "South Africa", code: "RSA" }],
  2014: [{ name: "Brazil", code: "BRA" }],
  2018: [{ name: "Russia", code: "RUS" }],
  2022: [{ name: "Qatar", code: "QAT" }],
};

/** Winner of the Final if present; null otherwise. */
export function championOf(t: HistoricalTournament): string | null {
  const final = t.matches.find((m) => m.round === "F");
  if (!final) return null;
  return winnerOf(final);
}

/** Which team won the match — handles regulation, extra time, penalties. */
export function winnerOf(m: HistoricalMatch): string | null {
  if (m.penaltyA !== null && m.penaltyB !== null) {
    return m.penaltyA > m.penaltyB ? m.teamA : m.teamB;
  }
  if (m.scoreA > m.scoreB) return m.teamA;
  if (m.scoreB > m.scoreA) return m.teamB;
  return null;
}
