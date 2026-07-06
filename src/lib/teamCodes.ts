/**
 * FIFA broadcast alpha-3 → flagcdn.com code.
 * flagcdn uses ISO 3166-1 alpha-2 for most, with `gb-eng`/`gb-sct` etc. for UK nations.
 */
const FIFA_TO_FLAG: Record<string, string> = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  SUI: "ch", CAN: "ca", BIH: "ba", QAT: "qa",
  BRA: "br", MAR: "ma", SCO: "gb-sct", HAI: "ht",
  USA: "us", AUS: "au", PAR: "py", TUR: "tr",
  GER: "de", CIV: "ci", ECU: "ec", CUW: "cw",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", URU: "uy", KSA: "sa",
  FRA: "fr", NOR: "no", SEN: "sn", IRQ: "iq",
  ARG: "ar", AUT: "at", ALG: "dz", JOR: "jo",
  COL: "co", POR: "pt", COD: "cd", UZB: "uz",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

export function flagCode(fifaCode: string): string {
  return FIFA_TO_FLAG[fifaCode] ?? fifaCode.toLowerCase();
}

export function flagUrl(fifaCode: string, size: 40 | 80 | 160 | 320 = 80): string {
  return `https://flagcdn.com/w${size}/${flagCode(fifaCode)}.png`;
}

export function flagUrl2x(fifaCode: string, size: 40 | 80 | 160 | 320 = 80): string {
  const nextSize = size === 40 ? 80 : size === 80 ? 160 : 320;
  return `https://flagcdn.com/w${nextSize}/${flagCode(fifaCode)}.png`;
}
