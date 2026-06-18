import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoginForm />
    </div>
  );
}
