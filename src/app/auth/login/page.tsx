import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black gradient-text">Bienvenido de vuelta</h1>
          <p className="text-gray-500 mt-2">Inicia sesión para explorar y crear eventos</p>
        </div>
        <div className="flex justify-center">
          <SignIn
            routing="hash"
            afterSignInUrl="/explorar"
            appearance={{
              variables: {
                colorPrimary: "#FF385C",
                colorBackground: "#ffffff",
                colorInputBackground: "#ffffff",
                colorInputText: "#222222",
                colorText: "#222222",
                colorTextSecondary: "#717171",
                borderRadius: "12px",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
