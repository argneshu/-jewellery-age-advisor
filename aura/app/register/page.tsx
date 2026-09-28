import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationForm } from "@/components/auth/RegistrationForm";

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-[560px] rounded-aura-xl border-border-soft bg-ivory p-9 shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-ink">
            Create your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RegistrationForm />
        </CardContent>
      </Card>
    </main>
  );
}
