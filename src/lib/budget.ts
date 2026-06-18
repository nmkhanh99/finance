import { round2 } from "./finance";

export interface BudgetEval {
  remaining: number; // limit - spent (âm nếu vượt)
  percent: number; // spent/limit * 100
  isOver: boolean;
}

/** Đánh giá tình trạng ngân sách một danh mục trong tháng. */
export function evaluateBudget(limit: number, spent: number): BudgetEval {
  const remaining = round2(limit - spent);
  const percent = limit > 0 ? round2((spent / limit) * 100) : 0;
  return { remaining, percent, isOver: spent > limit };
}
