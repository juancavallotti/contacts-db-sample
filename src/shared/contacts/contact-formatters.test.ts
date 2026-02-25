import { describe, expect, it } from "vitest";
import {
  buildContactEmailClipboardText,
  formatUsPhoneNumber,
} from "@/shared/contacts/contact-formatters";

describe("contact-formatters", () => {
  it("formats 10-digit US phone numbers", () => {
    expect(formatUsPhoneNumber("4155551212")).toBe("(415) 555-1212");
  });

  it("formats 11-digit US phone numbers with country code", () => {
    expect(formatUsPhoneNumber("14155551212")).toBe("+1 (415) 555-1212");
  });

  it("keeps non-us-style values unchanged", () => {
    expect(formatUsPhoneNumber("+44 20 1234 5678")).toBe("+44 20 1234 5678");
  });

  it("builds clipboard text for email", () => {
    const text = buildContactEmailClipboardText({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "4155551212",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(text).toContain("Name: Jane Doe");
    expect(text).toContain("Email: jane@example.com");
    expect(text).toContain("Phone: (415) 555-1212");
  });
});
