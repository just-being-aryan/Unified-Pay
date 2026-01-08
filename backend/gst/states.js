export const INDIAN_STATES = {
  MH: "Maharashtra",
  DL: "Delhi",
  KA: "Karnataka",
  TN: "Tamil Nadu",
  UP: "Uttar Pradesh",
  GJ: "Gujarat",
  RJ: "Rajasthan",
  WB: "West Bengal",
  PB: "Punjab",
  HR: "Haryana",
};

export function isValidState(code = "") {
  return Object.hasOwn(INDIAN_STATES, code);
}
