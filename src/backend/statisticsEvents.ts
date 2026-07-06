import db from "./db.js";

type StatisticsEventType =
  | "issue_created"
  | "issue_solved"
  | "issue_liked"
  | "comment_created"
  | "reaction_created";

type StatisticsEntityType = "issue" | "comment" | "reaction";

type StatisticsEventInput = {
  userId: number | null;
  actorUserId: number | null;
  eventType: StatisticsEventType;
  entityType: StatisticsEntityType;
  entityId: number | null;
};

export function recordStatisticsEvent({
  userId,
  actorUserId,
  eventType,
  entityType,
  entityId,
}: StatisticsEventInput) {
  db.prepare(`
    INSERT INTO statistics_events (user_id, actor_user_id, event_type, entity_type, entity_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, actorUserId, eventType, entityType, entityId);
}

export function hasStatisticsEvent(eventType: StatisticsEventType, entityType: StatisticsEntityType, entityId: number) {
  const event = db.prepare(`
    SELECT id
    FROM statistics_events
    WHERE event_type = ?
      AND entity_type = ?
      AND entity_id = ?
    LIMIT 1
  `).get(eventType, entityType, entityId);

  return Boolean(event);
}

export function hasActorStatisticsEvent(
  actorUserId: number,
  eventType: StatisticsEventType,
  entityType: StatisticsEntityType,
  entityId: number
) {
  const event = db.prepare(`
    SELECT id
    FROM statistics_events
    WHERE actor_user_id = ?
      AND event_type = ?
      AND entity_type = ?
      AND entity_id = ?
    LIMIT 1
  `).get(actorUserId, eventType, entityType, entityId);

  return Boolean(event);
}
