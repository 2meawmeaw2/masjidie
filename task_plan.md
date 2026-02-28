# Task Plan: Add Notifications (Adhan + Saved Events)

## Goal
Add two notification systems: (1) Adhan notifications with custom sounds for prayer times, and (2) default-sound notifications for user-saved events/reminders.

## Current Phase
Phase 1 (Implementation — approved by user)

## Scope Decision
- Phases 1-3 approved (fix cancelAll + event notifications + background rescheduling)
- Event notifications fire at exact event time (no offset)
- Phases 4-5 deferred (deep links + reminder UI)

## Phases

### Phase 1: Fix the `cancelAll` Conflict
The single biggest blocker: `adhanStore.ts` calls `cancelAllScheduledNotificationsAsync()` every time it reschedules prayer alarms (on app launch, foreground resume, prayer toggle, method change). This will **silently delete** any event notifications we add.

- [ ] Add notification identifier prefixes: `adhan-{prayer}-{date}` and `event-{eventId}`
- [ ] Replace `cancelAllScheduledNotificationsAsync()` with targeted cancellation that only removes adhan notifications
- [ ] Keep event notifications untouched when adhan reschedules
- **Status:** pending

### Phase 2: Build Event Notification System
- [ ] Create a new notification channel on Android for event reminders (default sound, normal importance)
- [ ] Add `scheduleEventNotification()` and `cancelEventNotification()` functions
- [ ] Integrate with `scheduleStore` — when user saves an event via `addEvent`, schedule a notification; on `removeEvent`, cancel it
- [ ] Handle both event types:
  - **Fixed-time events:** schedule at the stored `time` on the event date
  - **Prayer-anchored events:** compute absolute time from prayer time + offset, then schedule
- [ ] Add i18n keys for event notification title/body
- **Status:** pending

### Phase 3: Add Background Task for Rescheduling
Currently, if the phone reboots or the app is killed, all scheduled notifications are lost. The `RECEIVE_BOOT_COMPLETED` permission is declared but unused.

- [ ] Install `expo-task-manager` + `expo-background-fetch`
- [ ] Register a background task that reschedules both adhan and event notifications
- [ ] Wire up boot-completed to trigger rescheduling
- [ ] Test that notifications survive reboot
- **Status:** pending

### Phase 4: Add Notification Tap Handling (Deep Links)
- [ ] When user taps an adhan notification → navigate to Schedule tab (prayer times)
- [ ] When user taps an event notification → navigate to the event detail screen
- [ ] Set up `Notifications.addNotificationResponseReceivedListener` in `_layout.tsx`
- **Status:** pending

### Phase 5: UI — Notification Preferences
- [ ] Add a toggle in the saved-event flow: "Remind me" with time picker (e.g., 15min before, 30min before, at time)
- [ ] Persist reminder preference per event in `scheduleStore`
- [ ] Add i18n keys for all new UI strings
- **Status:** pending

## Key Questions (for user)
1. **Reminder timing for events:** Should event notifications fire at the exact event time, or X minutes before (e.g., 15min)? Or should the user choose?
2. **Background rescheduling:** Should we implement Phase 3 (background tasks) now, or defer it? It adds complexity + a new dependency.
3. **Notification tap navigation:** Is Phase 4 (deep links on tap) desired now or later?
4. **Multiple reminders:** Should users be able to set multiple reminders per event (e.g., 1 hour before + 15 min before)?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use notification identifier prefixes | Allows targeted cancellation — adhan reschedule won't nuke event notifications |
| Separate Android channel for events | Different sound (default) and importance level from adhan alarms |
| Reuse `expo-notifications` (no new library) | Already installed and configured; keeps things simple |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | — | — |

## Architecture Overview

```
Notification Channels (Android):
  ├── adhan_alarm        → custom adhan sound, MAX importance, bypass DnD
  ├── adhan_alarm_fajr   → custom Fajr sound, MAX importance, bypass DnD
  └── event_reminder     → default sound, HIGH importance (NEW)

Notification IDs:
  ├── adhan-fajr-2026-02-28    → prayer notifications (prefixed)
  └── event-{eventId}          → event notifications (prefixed)

Flow:
  App Launch → initializeAlarms() → schedule adhan + reschedule events
  Save Event → addEvent() → scheduleEventNotification()
  Remove Event → removeEvent() → cancelEventNotification()
  Foreground Resume → recalculateAndSchedule() → only cancels adhan-, re-adds adhan
```
