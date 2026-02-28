# Findings: Notification System

## Current State (What Already Exists)

### Adhan Notifications — Working
- `expo-notifications ~0.32.16` installed
- 2 custom sound files: `assets/sounds/adahnsounda.mp3` (general), `assets/sounds/adahnsoundfajr.mp3` (Fajr)
- 2 Android channels: `adhan_alarm` and `adhan_alarm_fajr` — MAX importance, bypass DnD, alarm audio usage
- Schedules today + tomorrow prayer times (max 10 notifications)
- Reschedules on foreground resume via `AppState` listener
- Foreground handler set in `_layout.tsx` (shows alert + plays sound)
- Battery optimization modal for Android (`BatteryOptimizationModal.tsx`)

### Event/Schedule System — No Notifications
- `scheduleStore.ts` saves events to AsyncStorage (`@saved_schedule`)
- Two event types: `FixedTimeEvent` (absolute time) and `PrayerAnchoredEvent` (relative to prayer)
- CRUD operations exist but NO notification scheduling on save/remove

### Background Tasks — None
- `RECEIVE_BOOT_COMPLETED` permission declared but no task registered
- No `expo-task-manager` installed
- Phone reboot = all notifications lost until app reopened

## Critical Issue: `cancelAllScheduledNotificationsAsync()`
In `adhanStore.ts`, `scheduleNotifications()` calls `cancelAllScheduledNotificationsAsync()` before rescheduling. This runs on:
- App launch
- Foreground resume
- Prayer toggle
- Calculation method change

**Impact:** Any event notifications would be silently deleted. Must switch to targeted cancellation using notification identifiers.

## Key Files
| File | Role |
|------|------|
| `lib/alarms.ts` | Channel setup, permission request, initialization entry point |
| `lib/stores/adhanStore.ts` | Prayer time calculation + notification scheduling |
| `lib/stores/scheduleStore.ts` | Saved events CRUD (no notifications) |
| `app/_layout.tsx` | Notification handler + foreground reschedule listener |
| `app.json` | Plugin config (sounds), Android permissions |
| `lib/i18n/*.json` | Translation keys (need new ones for event reminders) |

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use identifier prefixes (`adhan-*`, `event-*`) | Replace `cancelAll` with `cancelScheduledNotificationAsync(id)` per-identifier |
| New Android channel `event_reminder` | Default sound, HIGH importance (not MAX/alarm) |
| No new libraries for Phase 1-2 | `expo-notifications` handles everything needed |
| `expo-task-manager` for Phase 3 | Required for boot-completed rescheduling |
