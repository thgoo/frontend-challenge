/**
 * Validation errors travel as stable keys, never as prose: client-side checks and the API share
 * these schemas, and the UI localizes the key.
 */
export const FIELD_ERRORS = {
  required: 'required',
  nameRequired: 'name.required',
  usernameInvalid: 'username.invalid',
  usernameTaken: 'username.taken',
  emailInvalid: 'email.invalid',
  emailTaken: 'email.taken',
  passwordRequired: 'password.required',
  passwordTooShort: 'password.tooShort',
  passwordTooLong: 'password.tooLong',
  passwordNeedsLetter: 'password.needsLetter',
  passwordNeedsNumber: 'password.needsNumber',
  passwordUnchanged: 'password.unchanged',
  passwordIncorrect: 'password.incorrect',
  passwordMismatch: 'password.mismatch',
  bioTooLong: 'bio.tooLong',
  couponRequired: 'coupon.required',
  couponInvalid: 'coupon.invalid',
  couponExpired: 'coupon.expired',
  fullNameRequired: 'fullName.required',
  noteTooLong: 'note.tooLong',
  amountInvalid: 'amount.invalid',
  walletRequired: 'wallet.required',
  walletLabelRequired: 'wallet.labelRequired',
  walletLabelTooLong: 'wallet.labelTooLong',
  walletAddressInvalid: 'wallet.addressInvalid',
  walletAddressDuplicate: 'wallet.addressDuplicate',
  networkChanged: 'network.changed',
  avatarType: 'avatar.type',
  avatarSize: 'avatar.size',
} as const;

export type FieldError = (typeof FIELD_ERRORS)[keyof typeof FIELD_ERRORS];
