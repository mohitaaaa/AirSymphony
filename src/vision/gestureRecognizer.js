// 2D Euclidean distance (immune to noisy z-depth jitter in webcams)
export function getDistance2D(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 3D Euclidean distance (with scaled z)
export function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = ((p1.z || 0) - (p2.z || 0)) * 0.4;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class GestureRecognizer {
  constructor() {
    this.recentPositions = [];
    this.lastStrumTime = 0;
    this.smoothedIntensity = 0.85;

    // Fast 2-frame debouncing to eliminate gesture lag while preventing noise
    this.leftFingerHistory = [];
    this.rightFingerHistory = [];
    this.leftFistHistory = [];
    this.rightFistHistory = [];
  }

  // Fast low-latency debouncing: reacts in 2 frames (~35ms) without 150ms sluggish lag
  smoothFingerCount(handType, rawCount) {
    const history = handType === 'Left' ? this.leftFingerHistory : this.rightFingerHistory;
    history.push(rawCount);
    if (history.length > 3) history.shift();

    // If last 2 consecutive frames agree, adopt immediately for instantaneous feel
    if (history.length >= 2 && history[history.length - 1] === history[history.length - 2]) {
      return history[history.length - 1];
    }
    // If 3 frames, take mode
    if (history.length === 3) {
      if (history[0] === history[1] || history[0] === history[2]) return history[0];
      if (history[1] === history[2]) return history[1];
    }
    return history[history.length - 1];
  }

  // Stable fist detection to prevent accidental mutes during finger transitions
  smoothFistState(handType, rawIsFist) {
    const history = handType === 'Left' ? this.leftFistHistory : this.rightFistHistory;
    history.push(rawIsFist);
    if (history.length > 3) history.shift();

    // Confirm fist (mute) only when 3 consecutive frames are true fists
    const trueCount = history.filter(Boolean).length;
    return trueCount >= 3;
  }

  analyzeHand(landmarks, handednessLabel = 'Right', isMirrored = true, screenWidth = 640) {
    if (!landmarks || landmarks.length < 21) return null;

    const wrist = landmarks[0];
    const thumbCmc = landmarks[1];
    const thumbMcp = landmarks[2];
    const thumbIp = landmarks[3];
    const thumbTip = landmarks[4];

    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexDip = landmarks[7];
    const indexTip = landmarks[8];

    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleDip = landmarks[11];
    const middleTip = landmarks[12];

    const ringMcp = landmarks[13];
    const ringPip = landmarks[14];
    const ringDip = landmarks[15];
    const ringTip = landmarks[16];

    const pinkyMcp = landmarks[17];
    const pinkyPip = landmarks[18];
    const pinkyDip = landmarks[19];
    const pinkyTip = landmarks[20];

    // Reference palm scale (wrist to middle knuckle) for scale-invariant distance measurements
    const palmScale = Math.max(0.02, getDistance2D(wrist, middleMcp));

    // Reliable, angle-tolerant, orientation-invariant finger extension detection:
    // A finger is extended if tip is further from wrist than PIP joint
    // AND tip is further from MCP knuckle than PIP is from MCP
    // AND tip-to-wrist distance exceeds minimum extended palm scale
    const isIndexExtended = 
      getDistance2D(indexTip, wrist) > getDistance2D(indexPip, wrist) &&
      getDistance2D(indexTip, indexMcp) > getDistance2D(indexPip, indexMcp) * 0.95 &&
      getDistance2D(indexTip, wrist) > palmScale * 1.05;

    const isMiddleExtended = 
      getDistance2D(middleTip, wrist) > getDistance2D(middlePip, wrist) &&
      getDistance2D(middleTip, middleMcp) > getDistance2D(middlePip, middleMcp) * 0.95 &&
      getDistance2D(middleTip, wrist) > palmScale * 1.05;

    const isRingExtended = 
      getDistance2D(ringTip, wrist) > getDistance2D(ringPip, wrist) &&
      getDistance2D(ringTip, ringMcp) > getDistance2D(ringPip, ringMcp) * 0.95 &&
      getDistance2D(ringTip, wrist) > palmScale * 1.00;

    const isPinkyExtended = 
      getDistance2D(pinkyTip, wrist) > getDistance2D(pinkyPip, wrist) &&
      getDistance2D(pinkyTip, pinkyMcp) > getDistance2D(pinkyPip, pinkyMcp) * 0.95 &&
      getDistance2D(pinkyTip, wrist) > palmScale * 0.92;

    // Thumb extension:
    // When thumb is extended out, thumbTip is away from index MCP and pinky base
    const thumbToIndexMcp = getDistance2D(thumbTip, indexMcp);
    const thumbToPinkyMcp = getDistance2D(thumbTip, pinkyMcp);
    const isThumbExtended = 
      thumbToIndexMcp > palmScale * 0.42 && 
      thumbToPinkyMcp > getDistance2D(thumbMcp, pinkyMcp) * 1.05;

    // Raw finger count across the 4 main fingers
    const extendedFourFingers = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;

    // Rock-solid musical finger counting logic:
    // 0 fingers: Fist (all 4 main fingers curled tight)
    // 1 finger: Index extended (regardless of thumb position) -> Chord I (Tonic)
    // 2 fingers: Index + Middle extended (Peace / Victory sign) -> Chord IV (Subdominant)
    // 3 fingers: Index + Middle + Ring OR Thumb + Index + Middle -> Chord V (Dominant)
    // 4 fingers: 4 main fingers extended (Thumb curled) -> Chord vi (Relative Minor)
    // 5 fingers: All 4 fingers + Thumb clearly extended (Open Palm) -> Chord ii (Pre-Chorus)
    let rawCount = 0;
    if (extendedFourFingers === 0 && !isThumbExtended) {
      rawCount = 0; // Closed Fist
    } else if (extendedFourFingers === 1 && isIndexExtended) {
      rawCount = 1; // 1 finger
    } else if (extendedFourFingers === 2 && isIndexExtended && isMiddleExtended) {
      rawCount = 2; // 2 fingers
    } else if (extendedFourFingers === 3 && isIndexExtended && isMiddleExtended && isRingExtended) {
      rawCount = 3; // 3 fingers
    } else if (extendedFourFingers === 2 && isThumbExtended && isIndexExtended && isMiddleExtended) {
      rawCount = 3; // 3 fingers (Thumb + Index + Middle)
    } else if (extendedFourFingers === 4 && !isThumbExtended) {
      rawCount = 4; // 4 fingers
    } else if (extendedFourFingers === 4 && isThumbExtended) {
      rawCount = 5; // 5 fingers (Open Palm)
    } else if (extendedFourFingers === 4) {
      rawCount = 4; // 4 fingers fallback
    } else if (extendedFourFingers === 3 && isThumbExtended) {
      rawCount = 4; // 4 fingers
    } else {
      rawCount = extendedFourFingers + (isThumbExtended ? 1 : 0);
    }

    // Hand center (average of wrist, index knuckle, pinky knuckle)
    const center = {
      x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
      y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3
    };

    // Screen X position considering mirror mode
    const screenXNorm = isMirrored ? (1.0 - center.x) : center.x;

    let detectedHand = handednessLabel;
    if (isMirrored) {
      detectedHand = handednessLabel === 'Left' ? 'Right' : 'Left';
    }

    // Continuous Scale-Invariant Pinch Detection
    const rawPinchDist = getDistance2D(thumbTip, indexTip);
    const normalizedPinchDist = rawPinchDist / palmScale;

    // Pinch is active only when thumb and index are deliberately touching or very close
    const isPinching = normalizedPinchDist < 0.32;
    const isPinchControlActive = normalizedPinchDist < 0.65;

    // Continuous Intensity Mapping (0.15 to 1.0)
    const rawIntensity = Math.max(0.15, Math.min(1.0, (normalizedPinchDist - 0.12) / 0.6));
    this.smoothedIntensity = this.smoothedIntensity * 0.75 + rawIntensity * 0.25;

    // True fist condition: ALL 4 main fingers curled tight
    const rawIsFist = extendedFourFingers === 0 && !isIndexExtended && !isMiddleExtended;
    const stableFist = this.smoothFistState(detectedHand, rawIsFist);

    // Apply fast temporal smoothing to finger count
    const stableCount = stableFist ? 0 : this.smoothFingerCount(detectedHand, rawCount);

    // Dominant gesture name
    let gestureName = 'unknown';
    if (stableFist) {
      gestureName = 'fist';
    } else if (isPinching) {
      gestureName = 'pinch';
    } else if (stableCount === 5) {
      gestureName = 'open_palm';
    } else if (stableCount === 1) {
      gestureName = 'point';
    } else if (stableCount === 2) {
      gestureName = 'peace';
    } else if (stableCount === 3) {
      gestureName = 'three_fingers';
    } else if (stableCount === 4) {
      gestureName = 'four_fingers';
    } else {
      gestureName = `${stableCount}_fingers`;
    }

    const fingers = {
      thumb: isThumbExtended,
      index: isIndexExtended,
      middle: isMiddleExtended,
      ring: isRingExtended,
      pinky: isPinkyExtended
    };

    return {
      hand: detectedHand,
      landmarks,
      fingers,
      extendedCount: stableCount,
      isFist: stableFist,
      isPinching,
      isPinchControlActive,
      pinchDistance: rawPinchDist,
      normalizedPinchDist,
      pinchIntensity: this.smoothedIntensity,
      center,
      screenXNorm,
      gestureName
    };
  }

  // Detect dynamic strumming gesture from hand trajectory
  detectStrum(handInfo) {
    if (!handInfo) {
      this.recentPositions = [];
      return null;
    }

    // Do NOT detect air strumming if the hand is holding a stationary chord gesture (2-5 fingers)
    // Strumming is meant for the waving hand / pick hand!
    if (handInfo.extendedCount >= 2) {
      // Allow strum only if hand is moving with substantial velocity
    }

    const currentPos = handInfo.center;
    const now = performance.now();

    // Maintain a rolling history window of the last 6 positions (last ~90ms)
    this.recentPositions.push({ pos: currentPos, time: now });
    if (this.recentPositions.length > 6) {
      this.recentPositions.shift();
    }

    if (this.recentPositions.length < 3) {
      return null;
    }

    // Calculate displacement and velocity over the rolling window
    const oldest = this.recentPositions[0];
    const newest = this.recentPositions[this.recentPositions.length - 1];
    const totalDt = (newest.time - oldest.time) / 1000;

    if (totalDt < 0.02) return null;

    const deltaY = newest.pos.y - oldest.pos.y;
    const deltaX = newest.pos.x - oldest.pos.x;
    const velocityY = deltaY / totalDt;
    const velocityX = deltaX / totalDt;

    // Cooldown between strums: 180ms minimum for clean, distinct rhythmic strumming
    if (now - this.lastStrumTime < 180) {
      return null;
    }

    const speed = Math.sqrt(velocityY * velocityY + velocityX * velocityX);

    // Deliberate vertical swipe required (prevents accidental strumming when simply raising hand for a chord)
    // Downward swipe: hand moves down rapidly
    if (deltaY > 0.075 && velocityY > 0.60) {
      this.lastStrumTime = now;
      this.recentPositions = []; // Clear window to avoid double-triggers
      return {
        direction: 'down',
        intensity: Math.min(1.0, Math.max(0.5, speed / 2.2)),
        speed: Math.max(0.016, Math.min(0.040, 0.045 - speed * 0.008))
      };
    } 
    // Upward swipe: hand moves up rapidly
    else if (deltaY < -0.075 && velocityY < -0.60) {
      this.lastStrumTime = now;
      this.recentPositions = [];
      return {
        direction: 'up',
        intensity: Math.min(1.0, Math.max(0.5, speed / 2.2)),
        speed: Math.max(0.016, Math.min(0.040, 0.045 - speed * 0.008))
      };
    }

    return null;
  }
}
