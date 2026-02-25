"use client";

import { useState } from "react";
import {
  ClipboardDocumentIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { deleteContactAction, updateContactAction } from "@/actions/contacts";
import type { Contact } from "@/domain/contact";
import {
  ContactListActionType,
  ContactListStateProvider,
  useContactListState,
} from "@/components/contacts/contact-list-state";
import {
  buildContactEmailClipboardText,
  formatUsPhoneNumber,
} from "@/shared/contacts/contact-formatters";
import { validateContactInput } from "@/shared/contacts/contact-validation";

interface ContactListProps {
  contacts: Contact[];
}

export function ContactList({ contacts }: ContactListProps) {
  return (
    <ContactListStateProvider>
      <ContactListContent contacts={contacts} />
    </ContactListStateProvider>
  );
}

function ContactListContent({ contacts }: ContactListProps) {
  const { state, dispatch } = useContactListState();
  const selected = state.selected;
  const [editErrors, setEditErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null);

  if (contacts.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
        No contacts yet. Add your first one above.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Saved Contacts</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => (
          <article
            key={contact.id}
            className="relative flex h-full flex-col justify-between rounded-md border border-zinc-200 p-4"
          >
            <div className="absolute right-3 top-3 flex items-center gap-1">
              <button
                type="button"
                onClick={async () => {
                  const text = buildContactEmailClipboardText(contact);
                  await navigator.clipboard.writeText(text);
                  setClipboardStatus(`Copied ${contact.name} details`);
                  setTimeout(() => setClipboardStatus(null), 1500);
                }}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                title="Copy contact for email"
                aria-label={`Copy ${contact.name} for email`}
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: ContactListActionType.OPEN_EDIT_MODAL,
                    data: { contact },
                  })
                }
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                title="Edit contact"
                aria-label={`Edit ${contact.name}`}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>

              <form action={deleteContactAction}>
                <input type="hidden" name="id" value={contact.id} />
                <button
                  type="submit"
                  className="rounded-md p-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete contact"
                  aria-label={`Delete ${contact.name}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </form>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-zinc-900">{contact.name}</h3>
              <p className="text-sm text-zinc-600">{contact.email}</p>
              <p className="text-sm text-zinc-600">{formatUsPhoneNumber(contact.phone)}</p>
            </div>

            <div className="mt-4" />
          </article>
        ))}
      </div>
      {clipboardStatus ? (
        <p className="mt-3 text-sm text-emerald-700">{clipboardStatus}</p>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">Edit contact</h3>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: ContactListActionType.CLOSE_EDIT_MODAL })
                }
                className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Close
              </button>
            </div>

            <form
              action={async (formData) => {
                const candidate = {
                  name: String(formData.get("name") ?? ""),
                  email: String(formData.get("email") ?? ""),
                  phone: String(formData.get("phone") ?? ""),
                };
                const validated = validateContactInput(candidate);
                if (!validated.success) {
                  setEditErrors(validated.errors);
                  setEditFormError("Please fix validation errors.");
                  return;
                }

                setEditErrors({});
                setEditFormError(null);
                await updateContactAction(formData);
                dispatch({ type: ContactListActionType.CLOSE_EDIT_MODAL });
              }}
              className="grid gap-3"
            >
              <input type="hidden" name="id" value={selected.id} />

              <label className="flex flex-col gap-1 text-sm text-zinc-700">
                Name
                <input
                  name="name"
                  defaultValue={selected.name}
                  required
                  maxLength={120}
                  className="rounded-md border border-zinc-300 px-3 py-2 outline-none ring-zinc-900/20 focus:ring"
                />
                {editErrors.name ? (
                  <span className="text-xs text-red-600">{editErrors.name}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1 text-sm text-zinc-700">
                Email
                <input
                  name="email"
                  type="email"
                  defaultValue={selected.email}
                  required
                  maxLength={255}
                  className="rounded-md border border-zinc-300 px-3 py-2 outline-none ring-zinc-900/20 focus:ring"
                />
                {editErrors.email ? (
                  <span className="text-xs text-red-600">{editErrors.email}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1 text-sm text-zinc-700">
                Phone
                <input
                  name="phone"
                  defaultValue={selected.phone}
                  required
                  maxLength={20}
                  className="rounded-md border border-zinc-300 px-3 py-2 outline-none ring-zinc-900/20 focus:ring"
                />
                {editErrors.phone ? (
                  <span className="text-xs text-red-600">{editErrors.phone}</span>
                ) : null}
              </label>

              <div className="mt-2 flex justify-end gap-2">
                {editFormError ? (
                  <p className="mr-auto text-sm text-red-600">{editFormError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    dispatch({ type: ContactListActionType.CLOSE_EDIT_MODAL })
                  }
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
