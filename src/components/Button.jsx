const variants = {
  primary: "bg-white text-tinta border-2 border-tinta cap",
  secondary: "bg-biru text-white border-2 border-tinta cap",
  success: "bg-pensil text-tinta border-2 border-tinta cap",
  ghost: "bg-transparent text-lembut hover:text-tinta hover:bg-black/5",
  danger: "bg-white text-salah border-2 border-salah hover:bg-salah-muda",
}

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
}

const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "sm",
  type = "button",
  disabled = false,
  onClick,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
  >
    {children}
  </button>
)

export default Button
