"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Logo from "@/public/logonew.png"
import { useRouter } from "next/navigation"

export function Header() {
  const router =useRouter()
  return (
    <header className="fixed  top-0 left-0 right-0 z-50 bg-black bg-opacity-20 backdrop-blur-md">
      <div className="  max-w-7xl  mx-auto px-4 py-4 flex justify-between items-center h-16"> {/*Add a fixed height h-16 */}
        <Link href="/main" className="text-3xl font-bold flex gap-2 text-white">
        <Image src={Logo} alt="Logo" width={200} className="rounded-md" height={40} /> 
          {/*<span className="text-primary">Aivora</span>*/}
        </Link>
        <nav className="space-x-6">
          <Link href="#features" className="text-white hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#testimonials" className="text-white hover:text-primary transition-colors">
            Testimonials
          </Link>
          <Link href="#tools" className="text-white hover:text-primary transition-colors">
            Our Tech
          </Link>
          <Button onClick={()=>router.push("/login")}
            variant="outline" className="     transition-colors"
            
          >
            Log In
          </Button>
          {/* <Button className="bg-primary text-white hover:bg-primary/90 transition-colors">Sign Up</Button> */}
        </nav>
      </div>
    </header>
  )
}

