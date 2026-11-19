const Logo = ({ className = "" }) => (
  <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold ${className}`}>
    <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-tinta bg-pensil">
      <span className="h-3 w-3 rounded-full bg-tinta" />
    </span>
    EduTest
  </span>
)

export default Logo
