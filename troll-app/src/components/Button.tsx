type ButtonProps = {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
};

export default function Button({ onClick, className, children }: ButtonProps) {
  return (
    <button
      className={`wildr-button lg:rounded-2xl lg:text-lg ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
