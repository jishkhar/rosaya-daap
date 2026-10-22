import type { Field, ThemeSchema } from "@/themes/schema";

/**
 * What a tenant can change in Heritage. Field defaults are neutral fallbacks for a value missing from a saved config;
 * the full starting content for a new install is defaults.json.
 */

const heading = (eyebrow: string, title: string): Field[] => [
  {
    key: "eyebrow",
    type: "text",
    label: "Small heading",
    default: eyebrow,
    max: 60,
  },
  { key: "title", type: "text", label: "Heading", default: title, max: 80 },
];
const viewAll = (href = ""): Field[] => [
  {
    key: "href",
    type: "url",
    label: '"View all" link',
    default: href,
    help: "Leave empty to hide the link.",
  },
  {
    key: "link_label",
    type: "text",
    label: '"View all" text',
    default: "View all",
    max: 30,
  },
];
const link: Field[] = [
  { key: "label", type: "text", label: "Text", max: 60 },
  { key: "href", type: "url", label: "Link" },
];

export const schema: ThemeSchema = {
  settings: {
    brand: [
      {
        key: "name",
        type: "text",
        label: "Store name",
        default: "",
        max: 40,
        help: "Leave empty to use your business name.",
      },
      {
        key: "tagline",
        type: "text",
        label: "Tagline under the name",
        default: "",
        max: 40,
      },
      {
        key: "logo",
        type: "image",
        label: "Logo mark",
        default: "",
        help: "Square image shown next to the name. Leave empty to use your business logo.",
      },
    ],
    announcement: [
      {
        key: "enabled",
        type: "toggle",
        label: "Show the announcement bar",
        default: true,
      },
      {
        key: "messages",
        type: "list",
        label: "Messages",
        max: 6,
        itemLabel: "Message",
        fields: [{ key: "text", type: "text", label: "Message", max: 120 }],
        default: [],
      },
    ],
    header: [
      {
        key: "menu_limit",
        type: "number",
        label: "Collections in the menu",
        default: 5,
        min: 1,
        max: 8,
        help: 'Which collections appear is set in Collections ("Show in header").',
      },
      {
        key: "show_search",
        type: "toggle",
        label: "Show search",
        default: true,
      },
    ],
    footer: [
      {
        key: "tagline",
        type: "textarea",
        label: "Tagline",
        default: "",
        max: 200,
      },
      {
        key: "newsletter_title",
        type: "text",
        label: "Newsletter heading",
        default: "Join our newsletter",
        max: 60,
      },
      {
        key: "newsletter_note",
        type: "text",
        label: "Newsletter note",
        default: "No spam.",
        max: 120,
      },
      { key: "instagram", type: "url", label: "Instagram link", default: "" },
      { key: "facebook", type: "url", label: "Facebook link", default: "" },
      { key: "youtube", type: "url", label: "YouTube link", default: "" },
      {
        key: "columns",
        type: "list",
        label: "Link columns",
        max: 4,
        itemLabel: "Column",
        default: [],
        fields: [
          { key: "title", type: "text", label: "Column heading", max: 40 },
          {
            key: "store_collections",
            type: "toggle",
            label: "Start with your collections",
            default: false,
            help: 'Adds up to 6 of your collections and an "All collections" link.',
          },
          {
            key: "links",
            type: "list",
            label: "Links",
            max: 12,
            itemLabel: "Link",
            fields: link,
          },
        ],
      },
      {
        key: "address",
        type: "text",
        label: "Address line",
        default: "",
        max: 120,
      },
      {
        key: "phone",
        type: "text",
        label: "Phone or WhatsApp line",
        default: "",
        max: 120,
      },
      {
        key: "email",
        type: "text",
        label: "Email",
        default: "",
        max: 120,
        help: "Leave empty to use your business email.",
      },
      {
        key: "copyright",
        type: "text",
        label: "Copyright name",
        default: "",
        max: 80,
        help: "Shown after © and the year. Leave empty to use your business name.",
      },
      {
        key: "payments",
        type: "list",
        label: "Payment badges",
        max: 8,
        itemLabel: "Badge",
        fields: [{ key: "label", type: "text", label: "Badge", max: 20 }],
        default: [],
      },
    ],
    pages: [
      {
        key: "about",
        type: "textarea",
        label: "About us",
        default: "",
        max: 4000,
        help: "The About page. Leave a blank line between paragraphs.",
      },
      {
        key: "care",
        type: "textarea",
        label: "Care instructions",
        default: "",
        max: 1000,
        help: "Shown on every product page. Leave empty to hide it.",
      },
      { key: "faq", type: "textarea", label: "FAQs", default: "", max: 4000 },
    ],
  },
  sections: [
    {
      type: "hero",
      name: "Slideshow",
      fields: [
        {
          key: "slides",
          type: "list",
          label: "Slides",
          max: 5,
          itemLabel: "Slide",
          default: [],
          fields: [
            ...heading("", ""),
            { key: "text", type: "textarea", label: "Text", max: 240 },
            { key: "cta_label", type: "text", label: "Button text", max: 30 },
            { key: "cta_href", type: "url", label: "Button link" },
            {
              key: "cta2_label",
              type: "text",
              label: "Second button text",
              max: 30,
            },
            { key: "cta2_href", type: "url", label: "Second button link" },
            {
              key: "collection",
              type: "collection",
              label: "Pictures from collection",
              help: "None = your newest products.",
            },
          ],
        },
        {
          key: "badges",
          type: "list",
          label: "Small points under the buttons",
          max: 4,
          itemLabel: "Point",
          fields: [{ key: "text", type: "text", label: "Point", max: 30 }],
          default: [],
        },
      ],
    },
    {
      type: "featured-collections",
      name: "Your collections",
      fields: [
        ...heading("Curated for you", "Collections for every moment"),
        {
          key: "href",
          type: "url",
          label: '"View all" link',
          default: "/collections",
        },
        {
          key: "limit",
          type: "number",
          label: "How many",
          default: 8,
          min: 1,
          max: 12,
        },
      ],
    },
    {
      type: "product-rail",
      name: "Product row",
      fields: [
        {
          key: "source",
          type: "select",
          label: "Products",
          default: "new",
          options: [
            { value: "new", label: "Newest in stock" },
            { value: "value", label: "Lowest price in stock" },
          ],
        },
        ...heading("", "Products"),
        ...viewAll(),
      ],
    },
    {
      type: "category-circles",
      name: "Category circles",
      fields: [
        ...heading("Browse", "Shop by Category"),
        ...viewAll("/shop"),
        {
          key: "collections",
          type: "collections",
          label: "Categories",
          max: 8,
          default: [],
        },
      ],
    },
    {
      type: "occasions",
      name: "Arched tiles",
      fields: [
        ...heading("Celebrate", "Shop by Occasion"),
        {
          key: "collections",
          type: "collections",
          label: "Collections",
          max: 5,
          default: [],
        },
      ],
    },
    {
      type: "crafts",
      name: "Dark feature tiles",
      fields: [
        ...heading("", ""),
        { key: "text", type: "textarea", label: "Text", default: "", max: 240 },
        {
          key: "link_label",
          type: "text",
          label: "Tile link text",
          default: "Explore",
          max: 30,
        },
        {
          key: "collections",
          type: "collections",
          label: "Collections",
          max: 8,
          default: [],
        },
      ],
    },
    {
      type: "promise",
      name: "Promises",
      fields: [
        ...heading("", ""),
        {
          key: "title_accent",
          type: "text",
          label: "Heading ending (accent colour)",
          default: "",
          max: 60,
        },
        { key: "text", type: "textarea", label: "Text", default: "", max: 240 },
        {
          key: "cta_label",
          type: "text",
          label: "Button text",
          default: "",
          max: 30,
        },
        { key: "cta_href", type: "url", label: "Button link", default: "" },
        {
          key: "items",
          type: "list",
          label: "Promises",
          max: 4,
          itemLabel: "Promise",
          default: [],
          fields: [
            {
              key: "icon",
              type: "select",
              label: "Icon",
              default: "badge",
              options: [
                { value: "truck", label: "Delivery" },
                { value: "badge", label: "Quality" },
                { value: "tag", label: "Price" },
              ],
            },
            { key: "stat", type: "text", label: "Big text", max: 12 },
            { key: "stat_label", type: "text", label: "Label", max: 40 },
            { key: "text", type: "textarea", label: "Text", max: 200 },
            { key: "href", type: "url", label: "Link" },
          ],
        },
      ],
    },
    {
      type: "newsletter",
      name: "Newsletter",
      fields: [
        ...heading("", "Be the first to know"),
        { key: "text", type: "textarea", label: "Text", default: "", max: 240 },
        {
          key: "note",
          type: "text",
          label: "Small print",
          default: "No spam. Unsubscribe anytime.",
          max: 120,
        },
        {
          key: "image_collections",
          type: "collections",
          label: "Pictures from collections",
          max: 2,
          default: [],
          help: "None = your newest products.",
        },
      ],
    },
  ],
};
