import type { Contact } from "@/domain/contact";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatUsPhoneNumber(value: string): string {
  const digits = digitsOnly(value);

  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  return value;
}

export function buildContactEmailClipboardText(contact: Contact): string {
  return `Name: ${contact.name}\nEmail: ${contact.email}\nPhone: ${formatUsPhoneNumber(contact.phone)}`;
}
