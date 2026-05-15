import type { MockDataState, ConvEvent } from '../data/mockData';
import { assignRoundRobin } from './assignmentService';

function newEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function moveConversationToStage(
  state: MockDataState,
  conversationId: string,
  targetStageId: string,
  options: { actorId: string; force?: boolean }
): MockDataState {
  const conv = state.conversations[conversationId];
  const targetStage = state.stages[targetStageId];

  if (!conv || !targetStage) return state;
  if (!options.force && conv.stageId === targetStageId) return state;

  const now = new Date().toISOString();
  const newEvents: ConvEvent[] = [];

  // 1. Stage changed event
  newEvents.push({
    id: newEventId(),
    conversationId,
    type: 'stage_changed',
    fromStageId: conv.stageId,
    toStageId: targetStageId,
    actorId: options.actorId,
    createdAt: now,
  });

  // 2. Apply auto labels (merge)
  const existingLabels = new Set(conv.labels);
  const newLabels: string[] = [];
  for (const label of targetStage.autoLabels) {
    if (!existingLabels.has(label)) {
      newLabels.push(label);
      newEvents.push({
        id: newEventId(),
        conversationId,
        type: 'label_added',
        label,
        actorId: 'system',
        createdAt: now,
      });
    }
  }
  const mergedLabels = [...conv.labels, ...newLabels];

  // 3. Assign campaign
  const campaignId = targetStage.campaignId ?? conv.campaignId;

  // 4. Assign executor
  let nextState = state;
  let assigneeId: string | null = conv.assigneeId;

  if (targetStage.assignmentStrategy === 'round_robin' && targetStage.poolId) {
    const result = assignRoundRobin(nextState, targetStage.poolId);
    nextState = result.nextState;
    if (result.assignedUserId) {
      assigneeId = result.assignedUserId;
    }
  } else if (targetStage.assignmentStrategy === 'fixed' && targetStage.fixedUserId) {
    assigneeId = targetStage.fixedUserId;
  }
  // strategy 'none' → no change

  if (assigneeId !== conv.assigneeId) {
    newEvents.push({
      id: newEventId(),
      conversationId,
      type: 'assigned',
      assigneeId: assigneeId ?? undefined,
      actorId: options.actorId,
      createdAt: now,
    });
  }

  // 5. Build updated conversation
  const updatedConv = {
    ...conv,
    stageId: targetStageId,
    campaignId,
    labels: mergedLabels,
    assigneeId,
    updatedAt: now,
  };

  // 6. Merge events
  const existingEvents = nextState.events[conversationId] ?? [];

  return {
    ...nextState,
    conversations: {
      ...nextState.conversations,
      [conversationId]: updatedConv,
    },
    events: {
      ...nextState.events,
      [conversationId]: [...existingEvents, ...newEvents],
    },
  };
}
