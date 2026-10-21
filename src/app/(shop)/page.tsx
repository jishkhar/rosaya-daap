import { getStorefront } from "@/themes/registry";
import { RenderSections } from "@/themes/render";

export default async function Home() {
  const { theme, config } = await getStorefront();
  return <RenderSections theme={theme} sections={config.templates.home} />;
}
