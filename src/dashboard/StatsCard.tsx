interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  color: "primary" | "secondary" | "cta" | "green";
}

const colorClasses = {
  primary: {
    bg: "bg-primary-50",
    icon: "bg-primary-100 text-primary-600",
    text: "text-primary-600",
  },
  secondary: {
    bg: "bg-secondary-50",
    icon: "bg-secondary-100 text-secondary-600",
    text: "text-secondary-600",
  },
  cta: {
    bg: "bg-cta-50",
    icon: "bg-cta-100 text-cta-600",
    text: "text-cta-600",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    text: "text-green-600",
  },
};

const StatsCard = ({ icon, label, value, change, color }: StatsCardProps) => {
  const colors = colorClasses[color];

  return (
    <div
      className={`${colors.bg} rounded-2xl p-6 transition-all duration-300 hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}
        >
          {icon}
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-medium
            ${change.isPositive ? "text-green-600" : "text-red-600"}`}
          >
            {change.isPositive ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className={`text-3xl font-heading font-bold ${colors.text}`}>
          {value}
        </p>
        <p className="text-sm text-slate-600 mt-1">{label}</p>
      </div>
    </div>
  );
};

export default StatsCard;
