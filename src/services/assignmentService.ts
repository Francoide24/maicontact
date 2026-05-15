import type { MockDataState } from '../data/mockData';

/**
 * Assigns the next user in a pool using round-robin strategy.
 * Returns the assigned userId and updates assignmentState in a new state object.
 */
export function assignRoundRobin(
  state: MockDataState,
  poolId: string
): { assignedUserId: string | null; nextState: MockDataState } {
  const pool = state.pools[poolId];
  if (!pool) return { assignedUserId: null, nextState: state };

  const activeUsers = pool.userIds.filter((uid) => state.users[uid]?.isActive);
  if (activeUsers.length === 0) return { assignedUserId: null, nextState: state };

  const lastId = state.assignmentState.byPool[poolId]?.lastAssignedUserId ?? null;
  const lastIdx = lastId ? activeUsers.indexOf(lastId) : -1;
  const nextIdx = (lastIdx + 1) % activeUsers.length;
  const assignedUserId = activeUsers[nextIdx];

  const nextState: MockDataState = {
    ...state,
    assignmentState: {
      ...state.assignmentState,
      byPool: {
        ...state.assignmentState.byPool,
        [poolId]: { lastAssignedUserId: assignedUserId },
      },
    },
  };

  return { assignedUserId, nextState };
}
