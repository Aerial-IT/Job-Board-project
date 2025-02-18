import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/logo.png";
import { LoginForm } from "@/components/forms/LoginForm";

export default function Login() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-purple-50 to-blue-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6">
        {/* Logo section with animation */}
        <Link 
          href="/" 
          className="flex items-center gap-3 justify-center group transition-transform duration-300 hover:scale-105 mb-6"
        >
          <div className="relative size-12 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:rotate-6">
            <Image
              src={Logo}
              alt="Logo"
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Job{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Board
            </span>
          </h1>
        </Link>

        {/* Login form container */}
        <div className="w-full max-w-md transform transition-all duration-300">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}