import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "hot" | "warm" | "cold" | "won" | "lost" | "new" | "qualified" | "negotiation" | "scheduled" | "completed" | "pending";
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const statusConfig = {
    hot: {
      color: "bg-warning-100 text-warning-800 border-warning-200",
      icon: "🔥",
      defaultLabel: "Hot Lead",
    },
    warm: {
      color: "bg-accent-100 text-accent-800 border-accent-200",
      icon: "🌡️",
      defaultLabel: "Warm Lead",
    },
    cold: {
      color: "bg-surface-200 text-surface-800 border-surface-300",
      icon: "❄️",
      defaultLabel: "Cold Lead",
    },
    won: {
      color: "bg-success-100 text-success-800 border-success-200",
      icon: "✅",
      defaultLabel: "Deal Won",
    },
    lost: {
      color: "bg-warning-100 text-warning-800 border-warning-200",
      icon: "❌",
      defaultLabel: "Deal Lost",
    },
    new: {
      color: "bg-secondary-100 text-secondary-800 border-secondary-200",
      icon: "🆕",
      defaultLabel: "New",
    },
    qualified: {
      color: "bg-accent-100 text-accent-800 border-accent-200",
      icon: "⭐",
      defaultLabel: "Qualified",
    },
    negotiation: {
      color: "bg-primary-100 text-primary-800 border-primary-200",
      icon: "🤝",
      defaultLabel: "Negotiation",
    },
    scheduled: {
      color: "bg-surface-100 text-surface-800 border-surface-200",
      icon: "📅",
      defaultLabel: "Scheduled",
    },
    completed: {
      color: "bg-success-100 text-success-800 border-success-200",
      icon: "✓",
      defaultLabel: "Completed",
    },
    pending: {
      color: "bg-surface-100 text-surface-800 border-surface-200",
      icon: "⏳",
      defaultLabel: "Pending",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "status-badge inline-flex items-center font-medium border",
        config.color,
        sizeClasses[size],
        "rounded-full",
        className
      )}
    >
      {showIcon && <span className="mr-1.5">{config.icon}</span>}
      {displayLabel}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: "high" | "medium" | "low";
  size?: "sm" | "md" | "lg";
}

export function PriorityBadge({ priority, size = "md" }: PriorityBadgeProps) {
  const priorityConfig = {
    high: {
      color: "bg-warning-100 text-warning-800 border-warning-200",
      icon: "⚡",
      label: "High Priority",
    },
    medium: {
      color: "bg-accent-100 text-accent-800 border-accent-200",
      icon: "🔄",
      label: "Medium Priority",
    },
    low: {
      color: "bg-surface-200 text-surface-800 border-surface-300",
      icon: "🐢",
      label: "Low Priority",
    },
  };

  const config = priorityConfig[priority];
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        config.color,
        sizeClasses[size]
      )}
    >
      <span className="mr-1.5">{config.icon}</span>
      {config.label}
    </span>
  );
}

interface LeadScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function LeadScoreBadge({
  score,
  size = "md",
  showScore = true,
}: LeadScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-success-100 text-success-800 border-success-200";
    if (score >= 70) return "bg-accent-100 text-accent-800 border-accent-200";
    if (score >= 50) return "bg-secondary-100 text-secondary-800 border-secondary-200";
    return "bg-surface-200 text-surface-800 border-surface-300";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    return "Poor";
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        getScoreColor(score),
        sizeClasses[size]
      )}
    >
      <span className="mr-1.5">🎯</span>
      {showScore && <span className="font-bold mr-1">{score}</span>}
      {getScoreLabel(score)}
    </span>
  );
}

interface BudgetBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
}

export function BudgetBadge({ amount, size = "md" }: BudgetBadgeProps) {
  const formatBudget = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  const getBudgetColor = (amount: number) => {
    if (amount >= 10000000) return "bg-primary-100 text-primary-800 border-primary-200";
    if (amount >= 5000000) return "bg-secondary-100 text-secondary-800 border-secondary-200";
    return "bg-surface-100 text-surface-800 border-surface-200";
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        getBudgetColor(amount),
        sizeClasses[size]
      )}
    >
      <span className="mr-1.5">💰</span>
      {formatBudget(amount)}
    </span>
  );
}

interface TimelineBadgeProps {
  timeline: "urgent" | "soon" | "future" | "flexible";
  size?: "sm" | "md" | "lg";
}

export function TimelineBadge({ timeline, size = "md" }: TimelineBadgeProps) {
  const timelineConfig = {
    urgent: {
      color: "bg-warning-100 text-warning-800 border-warning-200",
      icon: "⏰",
      label: "Urgent",
    },
    soon: {
      color: "bg-accent-100 text-accent-800 border-accent-200",
      icon: "📅",
      label: "Soon",
    },
    future: {
      color: "bg-secondary-100 text-secondary-800 border-secondary-200",
      icon: "🗓️",
      label: "Future",
    },
    flexible: {
      color: "bg-surface-200 text-surface-800 border-surface-300",
      icon: "🔄",
      label: "Flexible",
    },
  };

  const config = timelineConfig[timeline];
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        config.color,
        sizeClasses[size]
      )}
    >
      <span className="mr-1.5">{config.icon}</span>
      {config.label}
    </span>
  );
}