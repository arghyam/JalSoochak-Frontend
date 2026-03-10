/** Generic user data shape used across panels (super-admin super-users, state-admin state-ut-admins) */
export interface UserAdminData extends Record<string, unknown> {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'active' | 'inactive'
}

export interface UserAdminRoutes {
  list: string
  add: string
  view: (id: string) => string
  edit: (id: string) => string
}

export interface UserAdminTableLabels {
  name: string
  mobileNumber: string
  emailAddress: string
  status: string
  actions: string
}

export interface UserAdminFormLabels {
  userDetails: string
  firstName: string
  lastName: string
  emailAddress: string
  phoneNumber: string
  statusSection: string
  activated: string
}

export interface UserAdminListLabels {
  pageTitle: string
  addButton: string
  allStatuses: string
  noItemsFound: string
  table: UserAdminTableLabels
  aria: {
    search: string
    view: string
    edit: string
  }
}

export interface UserAdminFormPageLabels {
  addTitle: string
  editTitle: string
  breadcrumb: {
    manage: string
    addNew: string
    edit: string
  }
  form: UserAdminFormLabels
  messages: {
    notFound: string
    itemAdded: string
    failedToAdd: string
    activatedSuccess: string
    deactivatedSuccess: string
    failedToUpdateStatus: string
    linkSentFeedback?: string
  }
  buttons: {
    addAndSendLink: string
  }
}

export interface UserAdminViewLabels {
  pageTitle: string
  viewTitle: string
  breadcrumb: {
    manage: string
    view: string
  }
  form: UserAdminFormLabels
  messages: {
    notFound: string
  }
  aria: {
    edit: string
  }
}

/** Minimal mutation interface — the generic components only need mutateAsync + isPending */
export interface UserAdminCreateMutation {
  mutateAsync: (input: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }) => Promise<UserAdminData>
  isPending: boolean
}

export interface UserAdminUpdateMutation {
  mutateAsync: (input: {
    id: string
    input: { firstName: string; lastName: string; phone: string }
  }) => Promise<unknown>
  isPending: boolean
}

export interface UserAdminStatusMutation {
  mutateAsync: (input: { id: string; status: 'active' | 'inactive' }) => Promise<unknown>
  isPending: boolean
}
