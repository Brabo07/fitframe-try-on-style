import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export const useAnalytics = () => {
  const trackEvent = useCallback(async (eventType: string, eventData?: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      await supabase.from("analytics_events").insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData || null,
      });
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }, []);

  return { trackEvent };
};
