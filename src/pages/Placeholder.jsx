import { Sparkles } from "lucide-react";

export default function Placeholder({ title, description, stage }) {
  return (
    <div>
      <h1>{title}</h1>
      <div className="card card-soft empty-page">
        <Sparkles size={28} color="var(--deep-rose)" />
        <h3>Coming soon</h3>
        <p className="muted">{description}</p>
        <span className="badge badge-outline">Planned for {stage}</span>
      </div>
    </div>
  );
}