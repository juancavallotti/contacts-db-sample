import { describe, expect, it } from "vitest";
import {
  validateContactId,
  validateContactInput,
} from "@/shared/contacts/contact-validation";

describe("contact-validation", () => {
  it("accepts valid contact input", () => {
    const result = validateContactInput({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "(415) 555-1212",
    });

    expect(result.success).toBe(true);
  });

  it("returns field errors for invalid input", () => {
    const result = validateContactInput({
      name: "",
      email: "invalid",
      phone: "abc",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    }
  });

  it("accepts a valid uuid id", () => {
    const result = validateContactId("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("rejects an invalid id", () => {
    const result = validateContactId("not-a-uuid");
    expect(result.success).toBe(false);
  });
});
