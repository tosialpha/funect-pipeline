"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  icon: ReactNode;
}

export function NavLink({ href, children, icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      prefetch={true}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
        isActive
          ? "text-teal-400"
          : "text-slate-400 hover:text-white"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-teal-500/10 border border-teal-500/20 rounded-xl"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      )}
      {!isActive && isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-800/50 rounded-xl"
          transition={{ duration: 0.15 }}
        />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
