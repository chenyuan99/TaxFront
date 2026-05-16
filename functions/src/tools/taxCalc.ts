import { z } from "genkit";
import { getAI } from "../ai";

// 2024 tax brackets: [upperBound, rate]
const BRACKETS_2024: Record<string, Array<[number, number]>> = {
  single: [[11600, 0.1], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [609350, 0.35], [Infinity, 0.37]],
  married_filing_jointly: [[23200, 0.1], [94300, 0.12], [201050, 0.22], [383900, 0.24], [487450, 0.32], [731200, 0.35], [Infinity, 0.37]],
  married_filing_separately: [[11600, 0.1], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [365600, 0.35], [Infinity, 0.37]],
  head_of_household: [[16550, 0.1], [63100, 0.12], [100500, 0.22], [191950, 0.24], [243700, 0.32], [609350, 0.35], [Infinity, 0.37]],
};

const STANDARD_DEDUCTIONS_2024: Record<string, number> = {
  single: 14600,
  married_filing_jointly: 29200,
  married_filing_separately: 14600,
  head_of_household: 21900,
};

const SS_WAGE_BASE_2024 = 168600;

function normalizeFilingStatus(status: string): string | null {
  const map: Record<string, string> = {
    single: "single", s: "single",
    mfj: "married_filing_jointly", "married filing jointly": "married_filing_jointly", married_filing_jointly: "married_filing_jointly", jointly: "married_filing_jointly",
    mfs: "married_filing_separately", "married filing separately": "married_filing_separately", married_filing_separately: "married_filing_separately", separately: "married_filing_separately",
    hoh: "head_of_household", "head of household": "head_of_household", head_of_household: "head_of_household",
  };
  return map[status.trim().toLowerCase()] ?? null;
}

function computeTaxFromBrackets(taxableIncome: number, brackets: Array<[number, number]>): number {
  let tax = 0;
  let prevUpper = 0;
  for (const [upper, rate] of brackets) {
    if (taxableIncome <= 0) break;
    const band = Math.min(taxableIncome, upper - prevUpper);
    tax += band * rate;
    taxableIncome -= band;
    prevUpper = upper;
  }
  return Math.round(tax * 100) / 100;
}

let _tools: ReturnType<typeof buildTaxCalcTools> | null = null;

function buildTaxCalcTools() {
  const ai = getAI();

  const calculateFederalTax = ai.defineTool(
    {
      name: "calculate_federal_tax",
      description: "Estimate 2024 federal income tax liability given gross income, filing status, optional itemized deductions, and additional income.",
      inputSchema: z.object({
        grossIncome: z.number().describe("Total wages, salaries, and ordinary income"),
        filingStatus: z.string().describe("single | married_filing_jointly | married_filing_separately | head_of_household"),
        deductions: z.number().optional().default(0).describe("Itemized deductions (0 = use standard deduction)"),
        additionalIncome: z.number().optional().default(0).describe("Interest, dividends, capital gains, etc."),
      }),
      outputSchema: z.unknown(),
    },
    async ({ grossIncome, filingStatus, deductions = 0, additionalIncome = 0 }) => {
      const status = normalizeFilingStatus(filingStatus);
      if (!status) return { status: "error", message: `Unknown filing status: '${filingStatus}'` };

      const brackets = BRACKETS_2024[status];
      const stdDeduction = STANDARD_DEDUCTIONS_2024[status];
      const actualDeduction = Math.max(deductions, stdDeduction);
      const totalIncome = grossIncome + additionalIncome;
      const taxableIncome = Math.max(0, totalIncome - actualDeduction);
      const estimatedTax = computeTaxFromBrackets(taxableIncome, brackets);

      let marginalRate = 0;
      for (const [upper, rate] of brackets) {
        if (taxableIncome <= upper) { marginalRate = rate; break; }
      }

      return {
        status: "ok", taxYear: 2024, filingStatus: status,
        grossIncome, additionalIncome, totalIncome,
        deductionUsed: actualDeduction, usedStandardDeduction: actualDeduction === stdDeduction,
        taxableIncome, estimatedFederalTax: estimatedTax,
        effectiveRatePct: totalIncome > 0 ? Math.round((estimatedTax / totalIncome) * 10000) / 100 : 0,
        marginalRatePct: marginalRate * 100,
        note: "Simplified estimate. Does not account for AMT, NIIT, credits, phase-outs, or state taxes.",
      };
    }
  );

  const getStandardDeduction = ai.defineTool(
    {
      name: "get_standard_deduction",
      description: "Return the 2024 standard deduction for a given filing status, including additional amounts for age 65+ or blindness.",
      inputSchema: z.object({
        filingStatus: z.string(),
        age65OrBlindCount: z.number().optional().default(0).describe("Number of qualifying conditions (age 65+ or blind per person)"),
      }),
      outputSchema: z.unknown(),
    },
    async ({ filingStatus, age65OrBlindCount = 0 }) => {
      const status = normalizeFilingStatus(filingStatus);
      if (!status) return { status: "error", message: `Unknown filing status: '${filingStatus}'` };
      const base = STANDARD_DEDUCTIONS_2024[status];
      const additional = 1550 * age65OrBlindCount;
      return { status: "ok", taxYear: 2024, filingStatus: status, baseStandardDeduction: base, additionalForAgeOrBlindness: additional, totalStandardDeduction: base + additional };
    }
  );

  const estimateSelfEmploymentTax = ai.defineTool(
    {
      name: "estimate_self_employment_tax",
      description: "Estimate self-employment (SE) tax for Schedule SE (2024). SE tax is 15.3% on 92.35% of net earnings up to $168,600, then 2.9% above.",
      inputSchema: z.object({ netProfit: z.number().describe("Net profit from Schedule C / self-employment") }),
      outputSchema: z.unknown(),
    },
    async ({ netProfit }) => {
      if (netProfit <= 0) return { status: "ok", netProfit, seTax: 0, deductibleHalf: 0, note: "No SE tax on net loss or zero profit." };
      const netEarnings = netProfit * 0.9235;
      const seTax = netEarnings <= SS_WAGE_BASE_2024
        ? netEarnings * 0.153
        : SS_WAGE_BASE_2024 * 0.153 + (netEarnings - SS_WAGE_BASE_2024) * 0.029;
      const rounded = Math.round(seTax * 100) / 100;
      return {
        status: "ok", taxYear: 2024, netProfit,
        netEarningsSubjectToSE: Math.round(netEarnings * 100) / 100,
        ssWageBase: SS_WAGE_BASE_2024, seTax: rounded,
        deductibleHalfOfSETax: Math.round(rounded / 2 * 100) / 100,
        note: "Deduct the deductible half from gross income when computing AGI (Schedule 1, Part II).",
      };
    }
  );

  const identifyApplicableCredits = ai.defineTool(
    {
      name: "identify_applicable_credits",
      description: "Identify common 2024 federal tax credits the taxpayer may qualify for based on filing status, AGI, and household situation.",
      inputSchema: z.object({
        filingStatus: z.string(),
        agi: z.number().describe("Adjusted Gross Income"),
        hasDependentChildren: z.boolean().optional().default(false),
        childCount: z.number().optional().default(0),
        paidChildCare: z.boolean().optional().default(false),
        paidEducationExpenses: z.boolean().optional().default(false),
        hasRetirementContributions: z.boolean().optional().default(false),
      }),
      outputSchema: z.unknown(),
    },
    async ({ filingStatus, agi, hasDependentChildren = false, childCount = 0, paidChildCare = false, paidEducationExpenses = false, hasRetirementContributions = false }) => {
      const status = normalizeFilingStatus(filingStatus);
      const credits: unknown[] = [];

      const ctcThreshold = status === "married_filing_jointly" ? 400000 : 200000;
      if (hasDependentChildren && childCount > 0 && agi < ctcThreshold) {
        credits.push({ credit: "Child Tax Credit (CTC)", maxPerChild: 2000, maxRefundablePerChild: 1700, qualifyingChildren: childCount, potentialMax: childCount * 2000, form: "Schedule 8812" });
      }

      const eitcLimits: Record<number, number> = { 0: status === "married_filing_jointly" ? 18591 : 17640, 1: status === "married_filing_jointly" ? 49084 : 46560, 2: status === "married_filing_jointly" ? 55768 : 52918, 3: status === "married_filing_jointly" ? 59899 : 56838 };
      const childrenForEITC = Math.min(childCount, 3);
      if (agi < eitcLimits[childrenForEITC] && status !== "married_filing_separately") {
        credits.push({ credit: "Earned Income Tax Credit (EITC)", qualifyingChildrenCounted: childrenForEITC, agiThreshold: eitcLimits[childrenForEITC], note: "Refundable. Use Schedule EIC.", form: "Schedule EIC" });
      }

      if (paidChildCare && hasDependentChildren) {
        credits.push({ credit: "Child and Dependent Care Credit", maxExpensesCovered: 6000, note: "Non-refundable. Employer FSA benefits reduce the expense base.", form: "Form 2441" });
      }

      if (paidEducationExpenses) {
        const aotcLimit = status === "married_filing_jointly" ? 180000 : 90000;
        if (agi < aotcLimit) credits.push({ credit: "American Opportunity Tax Credit (AOTC)", maxCredit: 2500, refundablePortion: "40% (up to $1,000)", note: "First 4 years of higher education only.", form: "Form 8863" });
        credits.push({ credit: "Lifetime Learning Credit (LLC)", maxCredit: 2000, note: "Non-refundable. No limit on years. Cannot combine with AOTC.", form: "Form 8863" });
      }

      const saversLimits: Record<string, number> = { married_filing_jointly: 76500, head_of_household: 57375, single: 38250, married_filing_separately: 38250 };
      if (hasRetirementContributions && status && agi < (saversLimits[status] ?? 38250)) {
        credits.push({ credit: "Saver's Credit", maxCredit: 1000, note: "Non-refundable. Rate (10/20/50%) depends on AGI.", form: "Form 8880" });
      }

      return credits.length === 0
        ? { status: "ok", creditsIdentified: [], message: "No common credits identified." }
        : { status: "ok", creditsIdentified: credits, disclaimer: "Screening tool only. Verify eligibility with IRS form instructions." };
    }
  );

  const compareFilingScenarios = ai.defineTool(
    {
      name: "compare_filing_scenarios",
      description: "Compare Married Filing Jointly vs Married Filing Separately tax liability to find which produces a lower bill.",
      inputSchema: z.object({
        spouse1Income: z.number(),
        spouse2Income: z.number(),
        totalDeductions: z.number().optional().default(0),
      }),
      outputSchema: z.unknown(),
    },
    async ({ spouse1Income, spouse2Income, totalDeductions = 0 }) => {
      function compute(status: string, income: number, deductions: number) {
        const s = normalizeFilingStatus(status)!;
        const brackets = BRACKETS_2024[s];
        const std = STANDARD_DEDUCTIONS_2024[s];
        const deductionUsed = Math.max(deductions, std);
        const taxable = Math.max(0, income - deductionUsed);
        return { filingStatus: s, income, deductionUsed, taxableIncome: taxable, estimatedTax: computeTaxFromBrackets(taxable, brackets) };
      }

      const mfj = compute("married_filing_jointly", spouse1Income + spouse2Income, totalDeductions);
      const mfs1 = compute("married_filing_separately", spouse1Income, totalDeductions / 2);
      const mfs2 = compute("married_filing_separately", spouse2Income, totalDeductions / 2);
      const mfsCombined = Math.round((mfs1.estimatedTax + mfs2.estimatedTax) * 100) / 100;

      return {
        status: "ok", taxYear: 2024,
        marriedFilingJointly: mfj,
        marriedFilingSeparately: { spouse1: mfs1, spouse2: mfs2, combinedTax: mfsCombined },
        taxDifferenceMFJMinusMFS: Math.round((mfj.estimatedTax - mfsCombined) * 100) / 100,
        lowerTaxOption: mfj.estimatedTax <= mfsCombined ? "married_filing_jointly" : "married_filing_separately",
        note: "MFS disqualifies EITC, education credits, child care credit. Lower tax alone may not make MFS the right choice.",
      };
    }
  );

  return { calculateFederalTax, getStandardDeduction, estimateSelfEmploymentTax, identifyApplicableCredits, compareFilingScenarios };
}

export function getTaxCalcTools() {
  if (!_tools) _tools = buildTaxCalcTools();
  return _tools;
}


