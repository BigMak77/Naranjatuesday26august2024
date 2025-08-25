"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

const locales = [
  { code: "en", label: "English" },
  { code: "pl", label: "Polski" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentLocale = pathname.split("/")[1]; // 'en' or 'pl'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    const newPath = `/${newLocale}${pathname.replace(/^\/(en|pl)/, "")}`;

    startTransition(() => {
      router.push(newPath);
    });
  };

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      disabled={isPending}
      className="border border-teal-300 rounded px-2 py-1 text-sm bg-white text-teal-900"
    >
      {locales.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
