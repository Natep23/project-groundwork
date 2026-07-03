import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const TrashIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.5h6.6L12 4M6.5 7v4M9.5 7v4" />
  </svg>
);

export const PencilIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M11.2 2.3l2.5 2.5L5.5 13l-3.2.7.7-3.2 8.2-8.2zM9.8 3.7l2.5 2.5" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const GripIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 5h8M4 8h8M4 11h8" />
  </svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M13 8H3M7 4L3 8l4 4" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export const LinkIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6.5 9.5l3-3M5 11l-.9.9a2.5 2.5 0 01-3.5-3.5L3.5 5.5M11 5l.9-.9a2.5 2.5 0 013.5 3.5L12.5 10.5" transform="translate(0 .5) scale(.93)" />
  </svg>
);

export const FlameIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M8 1.5c1 2 3.2 3.2 3.2 6a3.2 3.2 0 01-6.4 0c0-1 .4-1.7.9-2.3-.1.9.2 1.6.9 1.9-.4-2 .6-3.4 1.4-5.6zM6 12.2c.4.4 1 .6 1.7.5-.7-.6-.8-1.4-.4-2.2.6.5.9 1.1.9 1.9 0 1-.8 1.9-1.9 1.9-1.2 0-2.1-.9-2.1-2.1 0-.9.6-1.6 1.8-2 0 .8 0 1.5 0 2z" />
  </svg>
);

export const TrophyIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4.5 2.5h7v3a3.5 3.5 0 01-7 0v-3zM4.5 3.5H2v1a2.5 2.5 0 002.5 2.5M11.5 3.5H14v1a2.5 2.5 0 01-2.5 2.5M8 9v2.5M6 13.5h4M6.5 11.5h3v2h-3z" />
  </svg>
);

export const LockIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1" />
    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);
