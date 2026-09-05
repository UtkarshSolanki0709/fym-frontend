/**
 * Face-verification gates — on-device analysis of captured frames via ML Kit.
 *
 * Deliberately post-capture (not live frame processing): one small native dep,
 * and if the native module isn't linked (Expo Go, failed build) `analyzeFrame`
 * returns `available: false` and the flow degrades to manual capture + server
 * verification instead of hard-failing. Thresholds are first-pass values —
 * expect tuning after real device sessions. See docs/FACE_VERIFICATION.md.
 */
import FaceDetection, {
  type Face,
  type FaceDetectionOptions,
} from '@react-native-ml-kit/face-detection';

export type Stage = 'straight' | 'smile' | 'turn';

export const STAGES: Stage[] = ['straight', 'smile', 'turn'];

export const STAGE_INSTRUCTION: Record<Stage, string> = {
  straight: 'Look straight at the camera',
  smile: 'Now give us a smile',
  turn: 'Turn your head slowly to one side',
};

// ML Kit returns radians and 0..1 probabilities
const MAX_YAW_STRAIGHT = 0.26; // ~15°
const MAX_ROLL_STRAIGHT = 0.3; // ~17°
const MIN_YAW_TURN = 0.21; // ~12°
const MIN_FACE_WIDTH_RATIO = 0.2;
const MAX_OFF_CENTER_RATIO = 0.22;
const EYE_OPEN_THRESHOLD = 0.35;
const SMILE_THRESHOLD = 0.55;

const OPTIONS: FaceDetectionOptions = {
  performanceMode: 'accurate',
  classificationMode: 'all',
  minFaceSize: 0.1,
};

export type FaceCheck =
  | { available: false }
  | { available: true; ok: boolean; reason?: string };

/** Run ML Kit on a captured photo and apply the stage's gate. */
export async function analyzeFrame(
  uri: string,
  imageWidth: number,
  stage: Stage
): Promise<FaceCheck> {
  let faces: Face[];
  try {
    faces = await FaceDetection.detect(uri, OPTIONS);
  } catch {
    // Native module not linked (Expo Go / build without the pod)
    return { available: false };
  }

  if (faces.length === 0) {
    return { available: true, ok: false, reason: 'No face — move into the frame' };
  }
  if (faces.length > 1) {
    return { available: true, ok: false, reason: 'Multiple faces — just you in the frame' };
  }

  const gate = gateFace(faces[0], imageWidth, stage);
  return { available: true, ...gate };
}

/** Pure gate logic — throws nothing, lenient when a classification is missing. */
export function gateFace(
  face: Face,
  imageWidth: number,
  stage: Stage
): { ok: boolean; reason?: string } {
  const w = imageWidth || face.frame.width * 4; // fallback ratio if width unknown

  if (face.frame.width < MIN_FACE_WIDTH_RATIO * w) {
    return { ok: false, reason: 'Move a little closer' };
  }
  const centerX = face.frame.left + face.frame.width / 2;
  if (Math.abs(centerX - w / 2) > MAX_OFF_CENTER_RATIO * w) {
    return { ok: false, reason: 'Center your face in the oval' };
  }

  const eyeOpen =
    face.leftEyeOpenProbability == null && face.rightEyeOpenProbability == null
      ? true
      : ((face.leftEyeOpenProbability ?? 1) + (face.rightEyeOpenProbability ?? 1)) / 2 >=
        EYE_OPEN_THRESHOLD;
  if (!eyeOpen) {
    return { ok: false, reason: 'Open your eyes and look at the camera' };
  }

  const yaw = Math.abs(face.rotationY);
  const roll = Math.abs(face.rotationZ);

  if (stage === 'straight' && (yaw > MAX_YAW_STRAIGHT || roll > MAX_ROLL_STRAIGHT)) {
    return { ok: false, reason: 'Look straight at the camera' };
  }
  if (stage === 'smile') {
    // Lenient when classification is unavailable — the smile is re-checked by
    // the human eye at review time, not security-critical on its own
    if (face.smilingProbability != null && face.smilingProbability < SMILE_THRESHOLD) {
      return { ok: false, reason: 'Give us a bigger smile' };
    }
  }
  if (stage === 'turn' && yaw < MIN_YAW_TURN) {
    return { ok: false, reason: 'Turn your head a little more' };
  }

  return { ok: true };
}
