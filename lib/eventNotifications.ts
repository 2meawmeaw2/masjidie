import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import i18n from "@/lib/i18n";
import type { ScheduledEvent } from "@/lib/types/schedule";
import { useAdhanStore } from "@/lib/stores/adhanStore";

const EVENT_ID_PREFIX = "event-";
const EVENT_CHANNEL_ID = "event_reminder";

/**
 * Build a notification identifier for a scheduled event.
 */
function getEventNotificationId(eventId: string): string {
  return `${EVENT_ID_PREFIX}${eventId}`;
}

/**
 * Resolve the absolute Date for a ScheduledEvent.
 * - Fixed-time events: uses today's date + the stored HH:mm time.
 *   If that time has already passed today, schedules for tomorrow.
 * - Prayer-anchored events: uses the prayer time from adhanStore + offset.
 *   If that time has already passed today, uses tomorrow's prayer time.
 */
function resolveEventTime(event: ScheduledEvent): Date | null {
  const now = new Date();

  if (event.anchor === "fixed") {
    const [h, m] = event.time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;

    const target = new Date();
    target.setHours(h, m, 0, 0);

    // If already passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  // Prayer-anchored event
  const { todayTimes, tomorrowTimes } = useAdhanStore.getState();

  const todayPrayer = todayTimes.find((p) => p.name === event.prayerId);
  const tomorrowPrayer = tomorrowTimes.find((p) => p.name === event.prayerId);

  if (todayPrayer) {
    const target = new Date(todayPrayer.time.getTime() + event.offsetMinutes * 60_000);
    if (target > now) return target;
  }

  if (tomorrowPrayer) {
    const target = new Date(tomorrowPrayer.time.getTime() + event.offsetMinutes * 60_000);
    if (target > now) return target;
  }

  return null;
}

/**
 * Schedule a local notification for a saved event.
 * Fires at the exact event time with default system sound.
 */
export async function scheduleEventNotification(event: ScheduledEvent): Promise<void> {
  const time = resolveEventTime(event);
  if (!time) return;

  const identifier = getEventNotificationId(event.id);

  try {
    // Cancel any existing notification for this event first
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: i18n.t("notifications.eventReminderTitle"),
        body: i18n.t("notifications.eventReminderBody", { title: event.title }),
        ...(Platform.OS === "android" ? {} : { sound: "default" }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: time,
        ...(Platform.OS === "android" ? { channelId: EVENT_CHANNEL_ID } : {}),
      },
    });
  } catch (e) {
    console.error(`[EventNotifications] Failed to schedule for event ${event.id}:`, e);
  }
}

/**
 * Cancel the notification for a saved event.
 */
export async function cancelEventNotification(eventId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(getEventNotificationId(eventId));
  } catch (e) {
    // Notification might not exist — that's fine
  }
}

/**
 * Reschedule notifications for all saved events.
 * Called on app launch, foreground resume, and background task.
 */
export async function rescheduleAllEventNotifications(events: ScheduledEvent[]): Promise<void> {
  // Cancel all existing event notifications
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const eventIds = all
    .filter((n) => n.identifier.startsWith(EVENT_ID_PREFIX))
    .map((n) => n.identifier);

  await Promise.all(
    eventIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );

  // Reschedule each event
  for (const event of events) {
    await scheduleEventNotification(event);
  }
}
