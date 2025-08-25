"use client";

import React from "react";

type Props = {
  size?: number; // px
  initials?: string; // fallback text
  title?: string; // accessible label
};

export default function OrangeAvatar({
  size = 20,
  initials = "NJ",
  title = "Orange avatar",
}: Props) {
  const style = { ["--size" as string]: `${size}px` };
  return (
    <div className="orange-avatar" style={style} aria-label={title} role="img">
      <span className="orange-avatar__initials">{initials}</span>
    </div>
  );
}
