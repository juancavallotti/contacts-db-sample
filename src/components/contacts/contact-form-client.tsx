"use client";

import { useState } from "react";
import { createContactAction } from "@/actions/contacts";
import {
  contactEmailSchema,
  contactNameSchema,
  contactPhoneSchema,
  validateContactInput,
} from "@/shared/contacts/contact-validation";

type ContactFormErrors = {
  name?: string;
  email?: string;
  phone?: string;
};

export function ContactFormClient() {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [touched, setTouched] = useState<Record<keyof ContactFormErrors, boolean>>({
    name: false,
    email: false,
    phone: false,
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validateField = (field: keyof ContactFormErrors, value: string): string | undefined => {
    if (field === "name") {
      const result = contactNameSchema.safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    }
    if (field === "email") {
      const result = contactEmailSchema.safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    }
    const result = contactPhoneSchema.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };

  const handleFieldChange = (field: keyof ContactFormErrors, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Add Contact</h2>
      <form
        action={async (formData) => {
          const validated = validateContactInput(formValues);
          if (!validated.success) {
            setErrors(validated.errors);
            setFormError("Please fix validation errors.");
            setTouched({ name: true, email: true, phone: true });
            return;
          }

          setErrors({});
          setFormError(null);
          await createContactAction(formData);
          setFormValues({ name: "", email: "", phone: "" });
          setTouched({ name: false, email: false, phone: false });
        }}
        className="grid gap-4 md:grid-cols-3"
      >
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Name
          <input
            name="name"
            value={formValues.name}
            onChange={(event) => handleFieldChange("name", event.target.value)}
            required
            maxLength={120}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none ring-zinc-900/20 focus:ring"
            placeholder="Jane Doe"
          />
          {touched.name && errors.name ? (
            <span className="text-xs text-red-600">{errors.name}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Email
          <input
            name="email"
            type="email"
            value={formValues.email}
            onChange={(event) => handleFieldChange("email", event.target.value)}
            required
            maxLength={255}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none ring-zinc-900/20 focus:ring"
            placeholder="jane@example.com"
          />
          {touched.email && errors.email ? (
            <span className="text-xs text-red-600">{errors.email}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Phone
          <input
            name="phone"
            value={formValues.phone}
            onChange={(event) => handleFieldChange("phone", event.target.value)}
            required
            maxLength={20}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none ring-zinc-900/20 focus:ring"
            placeholder="(555) 123-4567"
          />
          {touched.phone && errors.phone ? (
            <span className="text-xs text-red-600">{errors.phone}</span>
          ) : null}
        </label>
        <div className="md:col-span-3">
          {formError ? <p className="mb-2 text-sm text-red-600">{formError}</p> : null}
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create contact
          </button>
        </div>
      </form>
    </section>
  );
}
