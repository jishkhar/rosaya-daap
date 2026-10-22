import { Suspense } from "react";
import { PasswordRecovery } from "@/components/ui/PasswordRecovery";

export const metadata = { title: "Reset password", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <PasswordRecovery mode="reset" />
    </Suspense>
  );
}
