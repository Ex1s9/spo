import { Suspense } from "react";

import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 p-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
