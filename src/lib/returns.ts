/** Website return requests: what the store API returns (money in paise) and the words shown for its codes. */

export type Returnable = {
  order_id: string;
  order_number: string;
  /** `closes_on`: the last day a return is accepted (null = no window, e.g. not delivered yet); `open`: can ask now. */
  window: { days: number; closes_on: string | null; open: boolean };
  exchanges_enabled: boolean;
  store_credit_enabled: boolean;
  loyalty_enabled: boolean;
  /** What the shopper needs to weigh points against money: `points_per_unit` points are worth `unit_value_minor` (paise) at checkout. */
  loyalty: {
    member: boolean;
    balance_points: number;
    points_per_unit: number;
    unit_value_minor: number;
  };
  lines: {
    order_item_id: string;
    sku: string;
    name: string;
    quantity: number;
    returned_quantity: number;
    returnable_quantity: number;
    unit_refund_minor: number;
  }[];
};

export type ReturnStatus =
  "requested" | "approved" | "rejected" | "completed" | "cancelled";
export type Preference =
  "refund" | "exchange" | "store_credit" | "loyalty_points";

export type CustomerReturn = {
  id: string;
  return_number: string;
  order_id: string;
  order_number: string;
  kind: "return" | "exchange";
  status: ReturnStatus;
  reason_code: ReasonCode;
  reason_note: string | null;
  preference: Preference | null;
  refund_mode: string | null;
  items_value_minor: number;
  refund_minor: number;
  /** Points credited when the return went back as loyalty points (0 otherwise). */
  loyalty_points: number;
  /** An exchange: the replacement the shopper chose, how any difference is paid, and the replacement order once it exists. */
  replacement: {
    variant_id: string;
    quantity: number;
    name: string;
    sku: string | null;
    unit_price_minor: number;
  }[];
  exchange_payment: "cod" | "online" | null;
  difference_minor: number;
  exchange_order_id: string | null;
  exchange_order_number: string | null;
  /** An online exchange's difference, paid when the exchange is asked for: what was due, what is paid, what is left (null once handled). */
  top_up: {
    due_minor: number;
    paid_minor: number;
    outstanding_minor: number;
  } | null;
  decision_note: string | null;
  created_at: string;
  completed_at: string | null;
  items: {
    name: string;
    sku: string;
    quantity: number;
    amount_minor: number;
  }[];
};

export type ReasonCode =
  | "defective"
  | "damaged"
  | "wrong_item"
  | "size_fit"
  | "changed_mind"
  | "other";

/** Points a refund of `valueMinor` (paise) becomes, rounded down like the shop does. */
export const pointsFor = (r: Returnable, valueMinor: number) =>
  Math.floor(
    (valueMinor * r.loyalty.points_per_unit) / r.loyalty.unit_value_minor,
  );

export const REASONS: { value: ReasonCode; label: string }[] = [
  { value: "size_fit", label: "Size or fit isn't right" },
  { value: "damaged", label: "Arrived damaged" },
  { value: "defective", label: "Faulty or not working" },
  { value: "wrong_item", label: "Wrong item sent" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other" },
];

export const PREFERENCES: Record<Preference, { label: string; hint: string }> =
  {
    refund: {
      label: "Money back",
      hint: "Refunded to you once the shop receives the items.",
    },
    loyalty_points: {
      label: "Loyalty points",
      hint: "Get the value as loyalty points to spend on your next order.",
    },
    exchange: {
      label: "Exchange",
      hint: "Swap for something else; the shop will contact you.",
    },
    store_credit: {
      label: "Store credit",
      hint: "Credit to spend on your next order.",
    },
  };

export const RETURN_STATUS: Record<
  ReturnStatus,
  { label: string; tone: string }
> = {
  requested: { label: "Requested", tone: "bg-sand text-ink" },
  approved: { label: "Approved", tone: "bg-accent/10 text-accent" },
  rejected: { label: "Declined", tone: "bg-danger/10 text-danger" },
  completed: { label: "Completed", tone: "bg-success/10 text-success" },
  cancelled: { label: "Cancelled", tone: "bg-black/5 text-ink-soft" },
};

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
