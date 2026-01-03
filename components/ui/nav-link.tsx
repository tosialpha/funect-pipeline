"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  icon: ReactNode;
}

export function NavLink({ href, children, icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      prefetch={true}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
        isActive
          ? "text-white"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeNavTab"
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-sky-500/5 rounded-lg border border-cyan-500/20"
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
      )}

      <span className={`relative z-10 transition-colors duration-200 ${
        isActive ? "text-cyan-400" : "group-hover:text-slate-300"
      }`}>
        {icon}
      </span>

      <span className="relative z-10 text-[13px] font-medium">{children}</span>
    </Link>
  );
}
