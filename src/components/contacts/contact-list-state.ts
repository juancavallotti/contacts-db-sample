"use client";

import {
  ReducerAction,
  bootstrapProvider,
} from "@eetr/react-reducer-utils";
import type { Contact } from "@/domain/contact";

export enum ContactListActionType {
  OPEN_EDIT_MODAL = "OPEN_EDIT_MODAL",
  CLOSE_EDIT_MODAL = "CLOSE_EDIT_MODAL",
}

export interface ContactListState {
  selected: Contact | null;
}

const initialState: ContactListState = {
  selected: null,
};

type ContactListAction =
  | (ReducerAction<ContactListActionType.OPEN_EDIT_MODAL> & {
      data: { contact: Contact };
    })
  | ReducerAction<ContactListActionType.CLOSE_EDIT_MODAL>;

function reducer(
  state: ContactListState = initialState,
  action: ContactListAction
): ContactListState {
  switch (action.type) {
    case ContactListActionType.OPEN_EDIT_MODAL:
      return {
        ...state,
        selected: action.data.contact,
      };
    case ContactListActionType.CLOSE_EDIT_MODAL:
      return {
        ...state,
        selected: null,
      };
    default:
      return state;
  }
}

const { Provider, useContextAccessors } = bootstrapProvider<
  ContactListState,
  ContactListAction
>(reducer, initialState);

export const ContactListStateProvider = Provider;
export const useContactListState = useContextAccessors;
