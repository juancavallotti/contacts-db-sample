import { z } from "zod";

export const contactNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name is too long");

export const contactEmailSchema = z
  .email("Email is invalid")
  .max(255, "Email is too long");

export const contactPhoneSchema = z
  .string()
  .trim()
  .refine((value) => /^[0-9()+\-\s.]{7,20}$/.test(value), {
    message: "Phone is invalid",
  });

export const contactIdSchema = z.uuid("Contact id is invalid");

export const contactInputSchema = z.object({
  name: contactNameSchema,
  email: contactEmailSchema,
  phone: contactPhoneSchema,
});

export type ContactInput = z.infer<typeof contactInputSchema>;

export type FieldErrors = Partial<Record<keyof ContactInput | "id", string>>;

export function validateContactInput(input: {
  name: string;
  email: string;
  phone: string;
}): { success: true; data: ContactInput } | { success: false; errors: FieldErrors } {
  const result = contactInputSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ContactInput | undefined;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return { success: false, errors };
}

export function validateContactId(
  id: string
): { success: true; data: string } | { success: false; errors: FieldErrors } {
  const result = contactIdSchema.safeParse(id);
  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: { id: result.error.issues[0]?.message ?? "Invalid id" } };
}
