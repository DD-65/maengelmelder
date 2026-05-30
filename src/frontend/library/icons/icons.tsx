// Icons von Heroicons (https://heroicons.com/)

interface IconProps {
  className?: string;
  title?: string;
  style?: React.CSSProperties;
  color?: string;
}

export function CommentIcon({ className, title, style }: IconProps) {
  return (
    <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden={title ? "false" : "true"}
    aria-label={title}
    style={style}
    className={className}
    >
    <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    strokeWidth="2.5"
    stroke="currentColor"
    fill="none"
    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" 
    />
    </svg>
  );
}

export function UserIcon({ className, title, style, color }: IconProps) {
  return (
    <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden={title ? "false" : "true"}
    aria-label={title}
    style={style}
    className={className}
    >
    <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    strokeWidth="2.0"
    stroke={color ?? "currentColor"}
    fill="transparent"
    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" 
    />
    </svg>
  );
}

export function TrashIcon({ className, title, style }: IconProps) {
  return (
    <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    aria-hidden={title ? "false" : "true"}
    aria-label={title}
    style={style}
    stroke-width="1.5" 
    stroke="currentColor" 
    className={className}
    >
    <path 
    stroke-linecap="round" 
    stroke-linejoin="round" 
    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" 
    />
    </svg>
  );
}
