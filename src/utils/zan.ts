/// The kind of target that can receive zan votes.
export type ZanTargetType = 'B' | 'BC' | 'P' | 'C'

/// The direction of one click: upvote or downvote.
export type ZanDelta = 1 | -1

/// The most net votes a normal user may hold on one target.
export const MAX_ZAN_VOTES = 20

/**
 * The net votes after a click on `mine`, mirroring the upstream HHHOJ server
 * (`server/include/site/zan_vote.hpp`).
 *
 * A target outside the multiple-vote lists keeps the one-vote rule: the same
 * side again changes nothing, the other side takes the vote back. A normal user
 * at the cap gets nothing (`null`); `unlimited` skips the cap.
 */
export function nextZan(
  mine: number,
  delta: ZanDelta,
  multi: boolean,
  unlimited = false,
): number | null {
  if (!multi) {
    if (mine === 0) {
      return delta
    }
    return (mine > 0) === (delta > 0) ? mine : 0
  }
  if (
    !unlimited &&
    ((delta > 0 && mine >= MAX_ZAN_VOTES) ||
      (delta < 0 && mine <= -MAX_ZAN_VOTES))
  ) {
    return null
  }
  return mine + delta
}
