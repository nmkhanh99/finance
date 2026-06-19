// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle (UI)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("mặc định 'Hệ thống' rồi cycle Sáng → Tối → Hệ thống khi bấm, có lưu localStorage", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");

    expect(btn).toHaveTextContent("Hệ thống");

    fireEvent.click(btn); // system -> light
    expect(btn).toHaveTextContent("Sáng");
    expect(localStorage.getItem("theme")).toBe("light");

    fireEvent.click(btn); // light -> dark
    expect(btn).toHaveTextContent("Tối");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(btn); // dark -> system
    expect(btn).toHaveTextContent("Hệ thống");
    expect(localStorage.getItem("theme")).toBe("system");
  });
});
