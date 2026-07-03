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
