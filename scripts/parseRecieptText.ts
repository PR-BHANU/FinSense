// parseReceipt.ts — amount-prefer-total + local ISO date + stricter payment detection

export type OCRLine =
  | string
  | { text: string; bbox?: { x: number; y: number; w: number; h: number } };

export type ParseResult = {
  amount: number | null;
  amountRaw: string | null;
  amountConfidence: number;
  date: string | null; // local ISO (no Z), e.g. 2018-05-20T22:55:00
  dateISO: string | null;
  dateConfidence: number;
  merchant: string | null;
  merchantConfidence: number;
  paymentMethod: string | null;
  paymentConfidence: number;
  categoryKeywords: string[];
  categoryConfidence: number;
  debug: {
    lines: string[];
    moneyCandidates: { text: string; idx: number; score: number }[];
    dateCandidates: { text: string; idx: number; score: number }[];
    merchantCandidates: { text: string; idx: number; score: number }[];
    paymentCandidates: { text: string; idx: number; score: number }[];
  };
};

const normalize = (s = '') =>
  s
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const digitsOnly = (s: string) => s.replace(/\D/g, '');

const looksLikePhone = (s = '') => {
  const d = digitsOnly(s);
  return d.length >= 6 && d.length <= 15 && /[\d\-\s\(\)\+]/.test(s);
};

const looksLikeGST = (s = '') =>
  /\bGSTIN\b|\bGST\b|[0-9A-Z]{2}[0-9A-Z]{10}[0-9A-Z]{3}/i.test(s);

const currencyRE = /(₹|INR|Rs\.?|USD|\$|€|£)/i;
// integer or decimal with optional commas; capture decimals preferentially
const numberTokenRE = /(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?/g;

function parseNumberFromString(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d\.\-\,]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toLocalIsoNoZ(d: Date): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(
    d.getHours(),
  )}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
}

/* tryParseDate: handles noisy '20-May- 18 22:55' and other common formats */
function tryParseDate(s: string): Date | null {
  if (!s) return null;
  const txt = s
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

  // dd-MMM-yy HH:MM (handles extra space before year)
  const dmyTime = txt.match(
    /\b(\d{1,2})-([A-Za-z]{3,9})-?\s*(\d{2,4})[ ,T\-]+(\d{1,2}):(\d{2})(?::(\d{2}))?\b/i,
  );
  if (dmyTime) {
    const [, dd, mon, yy, hh, mm, ss] = dmyTime;
    const months = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ];
    const mo = months.findIndex(m => mon.toLowerCase().startsWith(m));
    if (mo >= 0) {
      const year = Number(yy) < 100 ? 2000 + Number(yy) : Number(yy);
      const date = new Date(
        year,
        mo,
        Number(dd),
        Number(hh),
        Number(mm),
        ss ? Number(ss) : 0,
      );
      if (!isNaN(date.getTime())) return date;
    }
  }

  // ISO
  const iso = txt.match(/\b(20\d{2}|19\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  // D/M/Y or D-M-Y or D.M.Y (+ optional time)
  const dm = txt.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (dm) {
    const d = Number(dm[1]),
      m = Number(dm[2]),
      y = Number(dm[3]) < 100 ? 2000 + Number(dm[3]) : Number(dm[3]);
    return new Date(y, m - 1, d);
  }

  // D Mon YYYY / D Mon YY
  const dmy = txt.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{2,4})\b/);
  if (dmy) {
    const months = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ];
    const mo = months.findIndex(m => dmy[2].toLowerCase().startsWith(m));
    if (mo >= 0) {
      const d = Number(dmy[1]);
      const y = Number(dmy[3]) < 100 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
      return new Date(y, mo, d);
    }
  }

  // fallback: if year present, return Jan 1 of that year (low confidence)
  const year = txt.match(/\b(20\d{2}|19\d{2})\b/);
  if (year) return new Date(Number(year[1]), 0, 1);

  return null;
}

function tokenOverlapScore(text: string, candidate: string) {
  const t = text.toLowerCase().split(/\W+/).filter(Boolean);
  const c = candidate.toLowerCase().split(/\W+/).filter(Boolean);
  if (!c.length) return 0;
  let hit = 0;
  for (const w of c) if (t.includes(w)) hit++;
  return hit / c.length;
}

export function parseReceipt(
  linesRaw: OCRLine[],
  categories: string[] = [],
): ParseResult {
  const lines = linesRaw
    .map(l => normalize(typeof l === 'string' ? l : l.text || ''))
    .filter(Boolean);

  const moneyCandidates: { text: string; idx: number; score: number }[] = [];
  const dateCandidates: { text: string; idx: number; score: number }[] = [];
  const paymentCandidates: { text: string; idx: number; score: number }[] = [];
  const merchantCandidates: { text: string; idx: number; score: number }[] = [];

  // collect candidates
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];

    // merchant heuristic (top area, alphabetic, not phone/GST)
    if (i < 6 && /[A-Za-z]/.test(L)) {
      const digitRatio =
        digitsOnly(L).length / Math.max(1, L.replace(/\s+/g, '').length);
      if (
        !looksLikePhone(L) &&
        !looksLikeGST(L) &&
        digitRatio < 0.35 &&
        !/\b(invoice|receipt|tax|gst|bill|cash memo|token)\b/i.test(L)
      ) {
        merchantCandidates.push({
          text: L,
          idx: i,
          score: 0.7 + (6 - i) * 0.04,
        });
      }
    }

    // money candidates: any number-like token on the line
    const allNums = Array.from(L.matchAll(numberTokenRE)).map(m => m[0]);
    for (const nTok of allNums) {
      let score = 0.6;
      if (
        /\b(total|grand total|net payable|amount paid|balance|amount)\b/i.test(
          L,
        )
      )
        score += 0.25;
      if (/\b(subtotal|tax|gst|cgst|sgst|vat|service charge)\b/i.test(L))
        score -= 0.15;
      if (i > lines.length - 6) score += 0.1;
      moneyCandidates.push({ text: nTok, idx: i, score });
    }

    // payment candidates: strict tokens only
    if (
      /\b(upi|gpay|google pay|phonepe|paytm|amazon pay|netbanking|net banking)\b/i.test(
        L,
      ) ||
      /\b(visa|mastercard|rupay|amex|maestro|debit card|credit card)\b/i.test(
        L,
      ) ||
      /\b(cash)\b/i.test(L) ||
      /\b(paid via|paid using|payment mode|mode[:\s]|txn type|transaction)\b/i.test(
        L,
      ) ||
      /[A-Za-z0-9.\-_]+@[A-Za-z]{2,}/.test(L)
    ) {
      // avoid picking invoice numbers: require presence of payment token or 'paid'
      if (!/\b(inv|ino)\w*\b/i.test(L) || /\b(paid|card|upi|cash)\b/i.test(L)) {
        let sc = 0.8;
        if (/\b(upi|gpay|phonepe|paytm)\b/i.test(L)) sc = 0.95;
        else if (/\b(visa|mastercard|rupay|amex|maestro)\b/i.test(L)) sc = 0.9;
        paymentCandidates.push({ text: L, idx: i, score: sc });
      }
    }

    // date candidates
    if (/\b(date|bill date|invoice date|inv date)\b[:\s\-]/i.test(L)) {
      const after = L.split(/[:\-]/).slice(1).join('-').trim();
      if (after) {
        const pd = tryParseDate(after);
        if (pd) dateCandidates.push({ text: after, idx: i, score: 0.98 });
      } else if (lines[i + 1]) {
        const pd = tryParseDate(lines[i + 1]);
        if (pd)
          dateCandidates.push({ text: lines[i + 1], idx: i + 1, score: 0.9 });
      }
    } else {
      const p = tryParseDate(L);
      if (p)
        dateCandidates.push({
          text: L,
          idx: i,
          score: 0.85 + (i < 6 ? 0.1 : 0),
        });
    }
  }

  // --- AMOUNT SELECTION (robust) ---
  // 1) Find a "total" line and pick last numeric token there
  const totalLineIndex = lines.findIndex(
    (ln, idx) =>
      /\b(total|grand\s*total|net\s*payable|amount\s+paid|amount)\b[:\s\-]*$/i.test(
        ln,
      ) || /\btotal[:\s]/i.test(ln),
  );

  let bestMoney: { text: string; idx: number; score: number } | null = null;

  if (totalLineIndex !== -1) {
    const L = lines[totalLineIndex];
    const tokens = Array.from(L.matchAll(numberTokenRE)).map(m => m[0]);
    if (tokens.length) {
      const last = tokens[tokens.length - 1];
      bestMoney = { text: last, idx: totalLineIndex, score: 0.98 };
    }
  }

  // 2) If still nothing, take the last numeric token in the whole document (safer than largest)
  if (!bestMoney) {
    const allNums = moneyCandidates
      .filter(c => !looksLikeGST(c.text) && !looksLikePhone(c.text))
      .sort((a, b) => {
        if (a.idx !== b.idx) return a.idx - b.idx;
        return a.score - b.score;
      });
    if (allNums.length) {
      const last = allNums[allNums.length - 1];
      bestMoney = { ...last };
    }
  }

  const amount = bestMoney ? parseNumberFromString(bestMoney.text) : null;

  // --- DATE selection (prefer high score)
  const bestDateCand =
    dateCandidates.sort((a, b) => b.score - a.score || a.idx - b.idx)[0] ||
    null;
  let dateObj: Date | null = null;
  if (bestDateCand)
    dateObj =
      tryParseDate(bestDateCand.text) || tryParseDate(lines[bestDateCand.idx]);

  if (!dateObj) {
    // find "Invoice Date:" label and take next line if present
    for (let i = 0; i < lines.length; i++) {
      if (
        /^\s*(invoice date|bill date|date|inv date)\s*[:\-\s]*$/i.test(
          lines[i],
        ) &&
        lines[i + 1]
      ) {
        const p = tryParseDate(lines[i + 1]);
        if (p) {
          dateObj = p;
          break;
        }
      }
    }
  }

  // merchant selection
  let bestMerchant =
    merchantCandidates.sort((a, b) => b.score - a.score)[0] || null;
  if (!bestMerchant) {
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const L = lines[i];
      if (
        !looksLikePhone(L) &&
        !looksLikeGST(L) &&
        /[A-Za-z]/.test(L) &&
        digitsOnly(L).length < L.replace(/\s+/g, '').length * 0.35
      ) {
        bestMerchant = { text: L, idx: i, score: 0.5 };
        break;
      }
    }
  }

  // payment method: strict pick
  const bestPayment =
    paymentCandidates.sort((a, b) => b.score - a.score)[0] || null;
  let paymentMethod: string | null = null;
  let paymentConfidence = 0;
  if (bestPayment) {
    const t = bestPayment.text;
    const upiId = t.match(/([A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,})/i)?.[1];
    const cardType = t.match(/\b(visa|mastercard|rupay|amex|maestro)\b/i)?.[1];
    if (upiId) {
      paymentMethod = 'UPI';
      paymentConfidence = 0.95;
    } else if (cardType) {
      paymentMethod = cardType.toUpperCase();
      paymentConfidence = 0.9;
    } else if (/\bcash\b/i.test(t)) {
      paymentMethod = 'CASH';
      paymentConfidence = 0.85;
    } else {
      paymentMethod = 'OTHER';
      paymentConfidence = Math.min(1, bestPayment.score);
    }
  }

  // categories: token overlap if provided, otherwise empty
  const itemText = lines.join(' ');
  const catScores = categories
    .map(cat => ({ cat, score: tokenOverlapScore(itemText, cat) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const topCat = catScores[0] || null;

  const result: ParseResult = {
    amount,
    amountRaw: bestMoney ? bestMoney.text : null,
    amountConfidence: bestMoney ? Math.min(1, bestMoney.score) : 0,
    date: dateObj ? toLocalIsoNoZ(dateObj) : null,
    dateISO: dateObj ? toLocalIsoNoZ(dateObj) : null,
    dateConfidence: bestDateCand
      ? Math.min(1, bestDateCand.score)
      : dateObj
      ? 0.5
      : 0,
    merchant: bestMerchant ? bestMerchant.text : null,
    merchantConfidence: bestMerchant ? Math.min(1, bestMerchant.score) : 0,
    paymentMethod,
    paymentConfidence,
    categoryKeywords: topCat ? [topCat.cat] : [],
    categoryConfidence: topCat ? topCat.score : 0,
    debug: {
      lines,
      moneyCandidates,
      dateCandidates,
      merchantCandidates,
      paymentCandidates,
    },
  };

  return result;
}

export default parseReceipt;
