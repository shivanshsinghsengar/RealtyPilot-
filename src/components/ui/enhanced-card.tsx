import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
  shadow?: "sm" | "md" | "lg" | "none";
  border?: boolean;
  onClick?: () => void;
}

export function EnhancedCard({
  children,
  className,
  hoverable = true,
  padding = "md",
  shadow = "md",
  border = true,
  onClick,
}: EnhancedCardProps) {
  const paddingClasses = {
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
    none: "p-0",
  };

  const shadowClasses = {
    sm: "shadow-card",
    md: "shadow-elevated",
    lg: "shadow-elevated-lg",
    none: "shadow-none",
  };

  return (
    <div
      className={cn(
        "bg-white border border-border rounded-card",
        paddingClasses[padding],
        shadowClasses[shadow],
        hoverable && "hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-surface-600">{description}</p>
        )}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: ReactNode;
  color?: "primary" | "secondary" | "accent" | "success" | "warning";
  compact?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  color = "primary",
  compact = false,
}: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary-50 text-primary-600",
    secondary: "bg-secondary-50 text-secondary-600",
    accent: "bg-accent-50 text-accent-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
  };

  return (
    <EnhancedCard
      className={cn(
        compact ? "p-4" : "p-6",
        "flex items-center"
      )}
      hoverable={false}
      shadow="sm"
    >
      {icon && (
        <div className={cn("p-3 rounded-full mr-4", colorClasses[color])}>
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-surface-600">{title}</p>
        <div className="flex items-baseline mt-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <span
              className={cn(
                "ml-2 text-sm font-medium",
                change.startsWith("+") ? "text-success-600" : "text-warning-600"
              )}
            >
              {change}
            </span>
          )}
        </div>
      </div>
    </EnhancedCard>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  target?: string | number;
  trend?: "up" | "down" | "neutral";
  progress?: number;
  className?: string;
}

export function MetricCard({
  title,
  value,
  target,
  trend,
  progress,
  className,
}: MetricCardProps) {
  return (
    <EnhancedCard className={cn("p-6", className)}>
      <div className="mb-4">
        <p className="text-sm font-medium text-surface-600">{title}</p>
        <div className="flex items-baseline mt-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {target && (
            <span className="ml-2 text-sm text-surface-500">
              / {target}
            </span>
          )}
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-surface-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                progress >= 80
                  ? "bg-success-500"
                  : progress >= 60
                  ? "bg-accent-500"
                  : progress >= 40
                  ? "bg-secondary-500"
                  : "bg-warning-500"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {trend && (
        <div className="flex items-center mt-4 text-sm">
          <span
            className={cn(
              "font-medium",
              trend === "up"
                ? "text-success-600"
                : trend === "down"
                ? "text-warning-600"
                : "text-surface-600"
            )}
          >
            {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
          </span>
          <span
            className={cn(
              "ml-2",
              trend === "up"
                ? "text-success-600"
                : trend === "down"
                ? "text-warning-600"
                : "text-surface-600"
            )}
          >
            {trend === "up"
              ? "On track"
              : trend === "down"
              ? "Needs attention"
              : "Stable"}
          </span>
        </div>
      )}
    </EnhancedCard>
  );
}