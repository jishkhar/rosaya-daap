import { Suspense } from "react";
import { PasswordRecovery } from "@/components/ui/PasswordRecovery";

export const metadata = { title: "Forgot password" };

export default function Page() {
  return <Suspense><PasswordRecovery mode="forgot" /></Suspense>;
}
