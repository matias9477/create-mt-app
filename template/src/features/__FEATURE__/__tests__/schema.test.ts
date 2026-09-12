import { __FEATURE__Input } from "../schema";

describe("__FEATURE__Input", () => {
  it("accepts a valid input and trims whitespace", () => {
    const result = __FEATURE__Input.parse({ title: "  Hello  ", notes: " note " });
    expect(result.title).toBe("Hello");
    expect(result.notes).toBe("note");
  });

  it("rejects an empty title", () => {
    expect(__FEATURE__Input.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects a title over 120 characters", () => {
    expect(__FEATURE__Input.safeParse({ title: "x".repeat(121) }).success).toBe(false);
  });

  it("allows notes to be omitted", () => {
    expect(__FEATURE__Input.safeParse({ title: "ok" }).success).toBe(true);
  });
});
