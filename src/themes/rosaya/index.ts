import type { Theme } from "@/themes/types";
import defaults from "./defaults.json";
import { Header } from "./interactions";
import { AnnouncementBar, Footer } from "./layout";
import { schema } from "./schema";
import { sections } from "./sections";
import styles from "./rosaya.module.css";

export const rosaya: Theme = {
  key: "rosaya",
  name: "Rosaya",
  className: styles.shell,
  schema,
  defaults,
  AnnouncementBar,
  Header,
  Footer,
  sections,
};
