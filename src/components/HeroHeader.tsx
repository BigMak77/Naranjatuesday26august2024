import { FiStar } from 'react-icons/fi';

type HeroHeaderProps = {
  title: string
  subtitle?: string
  titleIcon?: React.ReactNode
}

export default function HeroHeader({ title, subtitle, titleIcon }: HeroHeaderProps) {
  // Replace any non-Feather icon or emoji with FiStar as a default
  const icon = titleIcon && typeof titleIcon === 'string' ? <FiStar /> : titleIcon;
  return (
    <header className="hero-header-neon">
      <h1>
        {icon && <span>{icon}</span>}
        {title}
      </h1>
      {subtitle && (
        <p>{subtitle}</p>
      )}
    </header>
  )
}
