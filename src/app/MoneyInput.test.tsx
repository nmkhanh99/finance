// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MoneyInput from "./MoneyInput";

describe("MoneyInput (UI)", () => {
  it("nhập 12196 -> hiện '12.196', hidden gửi '12196'", () => {
    const { container } = render(<MoneyInput name="amount" />);
    const text = screen.getByRole("textbox") as HTMLInputElement;
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    fireEvent.change(text, { target: { value: "12196" } });
    expect(text.value).toBe("12.196");
    expect(hidden.value).toBe("12196");
    expect(hidden.name).toBe("amount");
  });

  it("bỏ ký tự không phải số", () => {
    const { container } = render(<MoneyInput name="x" />);
    const text = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(text, { target: { value: "1a2b3c" } });
    expect(text.value).toBe("123");
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe("123");
  });

  it("defaultValue hiển thị có tách nghìn", () => {
    render(<MoneyInput name="x" defaultValue={1234567} />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("1.234.567");
  });
});
