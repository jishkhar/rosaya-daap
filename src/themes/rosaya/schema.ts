import type { Field, ThemeSchema } from "@/themes/schema";

const text = (key: string, label: string, max = 120): Field => ({
  key,
  label,
  type: "text",
  max,
});
const url = (key: string, label: string): Field => ({
  key,
  label,
  type: "url",
});
const image = (key: string, label: string): Field => ({
  key,
  label,
  type: "image",
});
const link: Field[] = [text("label", "Text"), url("href", "Link")];
const tiles: Field = {
  key: "items",
  label: "Tiles",
  type: "list",
  max: 12,
  itemLabel: "Tile",
  fields: [
    {
      key: "collection",
      type: "collection",
      label: "Collection",
      help: "The collection's live name, cover and storefront link are used automatically. Manage its details in Collections.",
    },
  ],
};

const source: Field = {
  key: "source",
  type: "select",
  label: "Collections to show",
  default: "all",
  options: [
    { value: "all", label: "Live catalogue (automatic)" },
    { value: "selected", label: "Selected collections" },
  ],
  help: "Automatic sections follow your ERP catalogue. Use Selected collections to curate the order below.",
};
const limit: Field = {
  key: "limit",
  type: "number",
  label: "Maximum tiles",
  min: 1,
  max: 12,
  default: 8,
};

/** Rosaya's reference layout; all copy, artwork, menus and destinations remain editable in the ERP. */
export const schema: ThemeSchema = {
  settings: {
    brand: [
      text("name", "Store name", 40),
      text("tagline", "Tagline", 40),
      image("logo", "Logo (complete image)"),
    ],
    announcement: [
      {
        key: "enabled",
        label: "Show announcement",
        type: "toggle",
        default: true,
      },
      text("text", "Message", 200),
      url("href", "Announcement link"),
    ],
    header: [
      {
        key: "show_search",
        label: "Show search",
        type: "toggle",
        default: true,
      },
      {
        key: "menu_limit",
        type: "number",
        label: "Collections in the menu",
        default: 8,
        min: 1,
        max: 12,
        help: 'Manage menu collections, order and submenus in Collections using "Show in header".',
      },
    ],
    footer: [
      text("marquee", "Scrolling message", 500),
      {
        key: "columns",
        label: "Link columns",
        type: "list",
        max: 3,
        itemLabel: "Column",
        fields: [
          text("title", "Heading"),
          {
            key: "store_collections",
            type: "toggle",
            label: "Show live store collections",
            default: false,
          },
          {
            key: "links",
            label: "Links",
            type: "list",
            max: 12,
            fields: link,
            itemLabel: "Link",
          },
        ],
      },
      text("newsletter_title", "Newsletter heading"),
      {
        key: "newsletter_url",
        label: "Newsletter signup page",
        type: "url",
        help: "Link to your mailing list signup page. Leave empty to offer a subscription request by email.",
      },
      text("email", "Contact email"),
      text("social_title", "Social links heading"),
      url("facebook", "Facebook"),
      url("instagram", "Instagram"),
      url("youtube", "YouTube"),
      text("copyright", "Copyright name"),
      text("payment_title", "Payment methods heading"),
      {
        key: "payments",
        label: "Payment badges",
        type: "list",
        max: 8,
        itemLabel: "Badge",
        fields: [text("label", "Name"), image("image", "Badge")],
      },
    ],
    pages: [
      { key: "about", label: "About us", type: "textarea", max: 4000 },
      { key: "care", label: "Care instructions", type: "textarea", max: 1000 },
      { key: "faq", label: "FAQs", type: "textarea", max: 4000 },
    ],
  },
  sections: [
    {
      type: "slideshow",
      name: "Full-width slideshow",
      fields: [
        {
          key: "slides",
          label: "Slides",
          type: "list",
          max: 5,
          itemLabel: "Slide",
          fields: [
            {
              key: "collection",
              type: "collection",
              label: "Pictures from collection",
              help: "Leave empty to show your newest products.",
            },
            {
              ...image("image", "Custom banner"),
              help: "Optional. Upload a custom banner to replace the product picture.",
            },
            text("alt", "Image description", 300),
            url("href", "Button link"),
            text("label", "Button text"),
          ],
        },
        {
          key: "autoplay",
          label: "Rotate slides automatically",
          type: "toggle",
          default: true,
        },
      ],
    },
    {
      type: "category-circles",
      name: "Category circles",
      fields: [text("title", "Heading"), source, limit, tiles],
    },
    {
      type: "occasions",
      name: "Occasion slider",
      fields: [text("title", "Heading"), source, limit, tiles],
    },
    {
      type: "crafts",
      name: "Craft tiles",
      fields: [
        text("title", "Heading"),
        text("text", "Subtitle", 240),
        source,
        limit,
        tiles,
      ],
    },
    {
      type: "promises",
      name: "Service promises",
      fields: [
        {
          key: "items",
          label: "Promises",
          type: "list",
          max: 6,
          itemLabel: "Promise",
          fields: [
            {
              key: "icon",
              label: "Icon",
              type: "select",
              default: "box",
              options: [
                { value: "box", label: "Package" },
                { value: "star", label: "Quality" },
                { value: "tag", label: "Price" },
              ],
            },
            text("title", "Heading"),
            { key: "text", label: "Description", type: "textarea", max: 600 },
          ],
        },
      ],
    },
    {
      type: "image-banner",
      name: "Image banner",
      fields: [
        image("image", "Banner"),
        text("alt", "Image description", 300),
        url("href", "Link"),
      ],
    },
    {
      type: "collection-cards",
      name: "Handcrafted collection cards",
      fields: [text("title", "Heading"), source, limit, tiles],
    },
  ],
};
