interface ComponentDescriptionProps {
  title: string;
  description: string;
}

export default function ComponentDescription({
  title,
  description
}: ComponentDescriptionProps) {
  return (
    <div className="neon-form-info">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
