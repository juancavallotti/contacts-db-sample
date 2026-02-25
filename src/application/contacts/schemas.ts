import {
  contactIdSchema,
  contactInputSchema,
} from "@/shared/contacts/contact-validation";

export { contactIdSchema };

export const createContactSchema = contactInputSchema;

export const updateContactSchema = createContactSchema;
