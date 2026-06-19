/**
 * Công thức tài chính cốt lõi.
 * Tất cả hàm nhận/đẩy `number` (caller tự convert từ Prisma Decimal qua Number()).
 * Lãi suất truyền vào dạng thập phân theo NĂM: 0.12 = 12%/năm.
 */

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ----- Net Worth -----

export interface NetWorthInput {
  accountBalances: number[]; // số dư các tài khoản (cash + bank)
  holdings: { quantity: number; currentPrice: number }[];
  debtsOutstanding: number[]; // dư nợ còn lại từng khoản
}

export function netWorth(input: NetWorthInput): number {
  const cash = input.accountBalances.reduce((s, b) => s + b, 0);
  const invest = input.holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const debt = input.debtsOutstanding.reduce((s, d) => s + d, 0);
  return round2(cash + invest - debt);
}

// ----- P&L đầu tư (chưa thực hiện) -----

export interface PnL {
  marketValue: number;
  costBasis: number;
  amount: number; // lãi/lỗ tuyệt đối
  percent: number; // %
}

export function unrealizedPnL(quantity: number, currentPrice: number, avgCost: number): PnL {
  const marketValue = quantity * currentPrice;
  const costBasis = quantity * avgCost;
  const amount = marketValue - costBasis;
  const percent = costBasis === 0 ? 0 : (amount / costBasis) * 100;
  return {
    marketValue: round2(marketValue),
    costBasis: round2(costBasis),
    amount: round2(amount),
    percent: round2(percent),
  };
}

/** Giá vốn trung bình gia quyền khi mua thêm. */
export function weightedAvgCost(
  oldQty: number,
  oldAvg: number,
  addQty: number,
  addPrice: number,
): number {
  const totalQty = oldQty + addQty;
  if (totalQty === 0) return 0;
  return (oldQty * oldAvg + addQty * addPrice) / totalQty;
}

// ----- Lãi vay -----

/** Lãi đơn. years có thể là phân số. */
export function simpleInterest(principal: number, annualRate: number, years: number): number {
  return round2(principal * annualRate * years);
}

/** Số dư sau lãi kép. periodsPerYear: số kỳ ghép lãi/năm (12 = theo tháng). */
export function compoundBalance(
  principal: number,
  annualRate: number,
  periodsPerYear: number,
  years: number,
): number {
  const r = annualRate / periodsPerYear;
  const n = periodsPerYear * years;
  return round2(principal * Math.pow(1 + r, n));
}

/** Khoản trả góp đều hằng tháng (annuity PMT). */
export function amortizingMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  const r = annualRate / 12;
  if (r === 0) return round2(principal / termMonths);
  const pmt = (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
  return round2(pmt);
}

export interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number; // dư nợ còn lại sau kỳ
}

/** Lịch trả nợ trả góp đều. */
export function amortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
): AmortRow[] {
  const r = annualRate / 12;
  const pmt = amortizingMonthlyPayment(principal, annualRate, termMonths);
  const rows: AmortRow[] = [];
  let balance = principal;
  for (let m = 1; m <= termMonths; m++) {
    const interest = round2(balance * r);
    let principalPart = round2(pmt - interest);
    if (m === termMonths) principalPart = round2(balance); // kỳ cuối trả hết
    balance = round2(balance - principalPart);
    rows.push({
      month: m,
      payment: round2(principalPart + interest),
      principal: principalPart,
      interest,
      balance: Math.max(balance, 0),
    });
  }
  return rows;
}

// ----- Kế hoạch mục tiêu -----

/**
 * Số tiền cần tiết kiệm mỗi tháng để đạt target trong `months` tháng.
 * annualRate: lãi suất tiết kiệm/năm (0 = không lãi). Có tính lãi kép tháng (FV annuity).
 */
export function requiredMonthlySaving(
  target: number,
  current: number,
  months: number,
  annualRate = 0,
): number {
  if (months <= 0) return round2(Math.max(target - current, 0));
  const r = annualRate / 12;
  const futureValueNeeded = target - current * Math.pow(1 + r, months);
  if (futureValueNeeded <= 0) return 0; // đã đủ nhờ tiền hiện có + lãi
  if (r === 0) return round2(futureValueNeeded / months);
  const pmt = (futureValueNeeded * r) / (Math.pow(1 + r, months) - 1);
  return round2(pmt);
}

// ----- Trả nợ: Avalanche vs Snowball -----

export interface DebtForSim {
  id: string;
  name: string;
  balance: number; // dư nợ hiện tại
  annualRate: number; // lãi/năm dạng thập phân
  minPayment: number; // khoản tối thiểu/tháng
}

export type PayoffStrategy = "avalanche" | "snowball";

export interface PayoffResult {
  months: number;
  totalInterest: number;
  totalPaid: number;
}

/**
 * Mô phỏng trả nợ. extraPerMonth: số tiền trả thêm ngoài tổng minPayment,
 * dồn vào khoản ưu tiên (avalanche = lãi cao nhất, snowball = dư nợ nhỏ nhất).
 */
export function simulatePayoff(
  debts: DebtForSim[],
  extraPerMonth: number,
  strategy: PayoffStrategy,
  maxMonths = 1200,
): PayoffResult {
  let remaining = debts.map((d) => ({ ...d }));
  let totalInterest = 0;
  let totalPaid = 0;
  let months = 0;

  while (remaining.some((d) => d.balance > 0.005) && months < maxMonths) {
    months++;
    // 1) cộng lãi tháng
    for (const d of remaining) {
      if (d.balance <= 0) continue;
      const interest = d.balance * (d.annualRate / 12);
      d.balance += interest;
      totalInterest += interest;
    }
    // 2) ngân sách tháng = tổng min của khoản chưa trả hết + extra
    const active = remaining.filter((d) => d.balance > 0);
    let budget = active.reduce((s, d) => s + d.minPayment, 0) + extraPerMonth;

    // 3) ưu tiên trả theo chiến lược
    const order = [...active].sort((a, b) =>
      strategy === "avalanche" ? b.annualRate - a.annualRate : a.balance - b.balance,
    );
    for (const d of order) {
      if (budget <= 0) break;
      const pay = Math.min(d.balance, budget);
      d.balance -= pay;
      budget -= pay;
      totalPaid += pay;
    }
  }

  return {
    months,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
  };
}

/**
 * Khoản trả tối thiểu/tháng cho mô phỏng = tiền góp cố định (annuity) theo
 * GỐC & KỲ HẠN BAN ĐẦU. Đây là nghĩa vụ thực mỗi tháng của khoản trả góp, KHÔNG
 * đổi theo dư nợ còn lại; áp lên dư nợ hiện tại vẫn tất toán đúng tiến độ.
 */
export function minimumMonthlyPayment(
  originalPrincipal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (originalPrincipal <= 0) return 0;
  if (termMonths <= 0) return round2(originalPrincipal); // không kỳ hạn -> coi như trả 1 lần
  return amortizingMonthlyPayment(originalPrincipal, annualRate, termMonths);
}

export interface DebtInput {
  id: string;
  name: string;
  principal: number; // gốc ban đầu
  annualRate: number;
  termMonths: number;
  paidPrincipal: number; // tổng gốc đã trả
}

/**
 * Chuyển khoản nợ thô -> input mô phỏng trả nợ:
 *  - balance = gốc ban đầu − tổng gốc đã trả (dư nợ thực còn lại)
 *  - minPayment = tiền góp cố định theo GỐC & KỲ HẠN BAN ĐẦU (xem minimumMonthlyPayment),
 *    KHÔNG tính lại theo dư nợ còn lại (tránh hạ thấp khoản tối thiểu thực tế).
 */
export function toDebtForSim(d: DebtInput): DebtForSim {
  return {
    id: d.id,
    name: d.name,
    balance: Math.max(d.principal - d.paidPrincipal, 0),
    annualRate: d.annualRate,
    minPayment: minimumMonthlyPayment(d.principal, d.annualRate, d.termMonths),
  };
}
