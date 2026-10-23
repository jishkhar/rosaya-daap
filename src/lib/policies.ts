/** The shop's written policies (portal Settings > Policies) and where each one is shown on the website. */
export type PolicyKind =
  "returns" | "privacy" | "terms" | "shipping" | "contact" | "legal";
export type Policies = Record<PolicyKind, string>;

export const POLICY_PAGES: Record<PolicyKind, { label: string; href: string }> =
  {
    returns: { label: "Refund policy", href: "/help/returns" },
    privacy: { label: "Privacy policy", href: "/privacy" },
    terms: { label: "Terms of service", href: "/terms" },
    shipping: { label: "Shipping policy", href: "/help/shipping" },
    contact: { label: "Contact information", href: "/contact" },
    legal: { label: "Legal notice", href: "/legal" },
  };

export const NO_POLICIES: Policies = {
  returns: "",
  privacy: "",
  terms: "",
  shipping: "",
  contact: "",
  legal: "",
};

/** Links to the policies the shop has written, for the footer. */
export const policyLinks = (p: Policies) =>
  (Object.keys(POLICY_PAGES) as PolicyKind[])
    .filter((k) => p[k])
    .map((k) => POLICY_PAGES[k]);
