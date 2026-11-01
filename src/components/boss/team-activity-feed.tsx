"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone,
  Calendar,
  MessageSquare,
  UserPlus,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  lead_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export function TeamActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setActivities(data);
      }
      setIsLoading(false);
    };

    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("team-activities")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setActivities((prev) => [payload.new as Activity, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lead_created":
        return <UserPlus className="h-4 w-4" />;
      case "stage_changed":
        return <TrendingUp className="h-4 w-4" />;
      case "visit_scheduled":
        return <Calendar className="h-4 w-4" />;
      case "whatsapp_sent":
        return <MessageSquare className="h-4 w-4" />;
      case "call_made":
        return <Phone className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "lead_created":
        return "text-blue-600 bg-blue-50";
      case "stage_changed":
        return "text-green-600 bg-green-50";
      case "visit_scheduled":
        return "text-purple-600 bg-purple-50";
      case "whatsapp_sent":
        return "text-pink-600 bg-pink-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Team Activity Feed</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Activity Feed</h3>
        <Badge variant="outline" className="animate-pulse">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500" />
          Live Updates
        </Badge>
      </div>

      <div className="max-h-[500px] space-y-3 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${getActivityColor(
                  activity.activity_type
                )}`}
              >
                {getActivityIcon(activity.activity_type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {activity.activity_type.replace("_", " ")}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
