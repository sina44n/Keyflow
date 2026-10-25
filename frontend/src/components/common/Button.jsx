import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] shadow-sm font-semibold hover:shadow-[0_0_20px_var(--accent)] hover:shadow-opacity-30',
    secondary:
      'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)] border border-[var(--border)]',
    outline:
      'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    accentGhost:
      'bg-transparent text-[var(--accent)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border)]',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};
