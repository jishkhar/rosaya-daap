/** What the shop has switched on for its website (the platform's Online options, GET /store/features). Each one off hides its part of the
 * site; the store API refuses it either way. Unknown (store API unreachable) = everything on, so nothing disappears on a hiccup.
 * Plain data, no "use client": the server (themes/registry.ts) calls toFeatures and reads ALL_FEATURES, which a client module's exports
 * can't be -- there they are only references, so toFeatures() throws and ALL_FEATURES.browse is undefined (the whole site shows "closed"). */
export type StoreFeatures = {
  browse: boolean;
  cart: boolean;
  tracking: boolean;
  accounts: boolean;
  addresses: boolean;
  coupons: boolean;
  reviews: boolean;
  payments: boolean;
};

export const ALL_FEATURES: StoreFeatures = {
  browse: true,
  cart: true,
  tracking: true,
  accounts: true,
  addresses: true,
  coupons: true,
  reviews: true,
  payments: true,
};

/** The API's option keys -> the site's names. Saved addresses and order tracking live in the account, so they need accounts too. */
export function toFeatures(options: Record<string, boolean>): StoreFeatures {
  const on = (key: string) => options[key] !== false;
  const accounts = on("online.customer_accounts");
  return {
    browse: on("online.browse_products"),
    // this website's checkout needs a signed-in shopper, so without accounts it can't take orders either
    cart: accounts && on("online.cart_checkout"),
    tracking: accounts && on("online.order_tracking"),
    accounts,
    addresses: accounts && on("online.saved_addresses"),
    coupons: on("online.discount_codes"),
    reviews: on("online.reviews_feedback"),
    payments: on("online.online_payments"),
  };
}
