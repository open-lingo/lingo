/**
 * Learn-ahead acknowledgement (v1.5). Locked hub tiles are clickable: the
 * first press opens a "Looking ahead?" confirmation. Ticking "Don't ask
 * again" persists here, after which locked tiles toggle like any other.
 * The ack is a dialog suppressor, NOT a permission — ahead sessions are
 * always allowed, they just write no SRS (see gradeTrainerSessionIfOnPath).
 */
const LEARN_AHEAD_ACK_KEY = "lingo:conjugation-trainer:learn-ahead-ack:v1";

export function hasLearnAheadAck(): boolean {
  try {
    return localStorage.getItem(LEARN_AHEAD_ACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLearnAheadAck(): void {
  try {
    localStorage.setItem(LEARN_AHEAD_ACK_KEY, "1");
  } catch {
    // quota / no localStorage — the dialog just shows again next time
  }
}

/** Test helper: reset the ack. */
export function clearLearnAheadAck(): void {
  try {
    localStorage.removeItem(LEARN_AHEAD_ACK_KEY);
  } catch {
    // no localStorage
  }
}
