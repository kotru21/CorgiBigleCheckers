import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import type { Position3D } from "../types";
import { damp, easings } from "../lib/easings";
import {
  interpolatePosition,
  interpolateJumpPosition,
  calculateProgress,
  boardToWorld,
} from "../lib/interpolation";
import { useAnimationStore, ANIMATION_CONFIG } from "../store/animationStore";

interface UsePieceAnimationProps {
  boardRow: number;
  boardCol: number;
  isSelected: boolean;
  isHovered: boolean;
  animationId?: string | null | undefined;
  groupRef: React.RefObject<THREE.Group | null>;
  pieceType: "beagle" | "corgi";
}

interface UsePieceAnimationResult {
  isMoving: boolean;
}

const SMOOTH_SPEED = {
  HEIGHT: 12,
  ROTATION: 8,
  SCALE: 10,
  TILT: 15,
};

const THRESHOLDS = {
  HEIGHT: 0.0005,
  ROTATION: 0.005,
  SCALE: 0.001,
};

export function usePieceAnimation({
  boardRow,
  boardCol,
  isSelected,
  isHovered,
  animationId,
  groupRef,
  pieceType,
}: UsePieceAnimationProps): UsePieceAnimationResult {
  const targetWorldPos = boardToWorld(boardRow, boardCol);
  const [isMoving, setIsMoving] = useState(false);

  const currentHeightRef = useRef(0);
  const currentRotationYRef = useRef(0);
  const currentTiltZRef = useRef(0);
  const targetRotationYRef = useRef(0);

  const wasAnimatingRef = useRef(false);
  const startRotationYRef = useRef(0);
  const animationProgressRef = useRef(0);
  const spinAccumulatorRef = useRef(0);

  const { getAnimatingPiece, completeAnimation } = useAnimationStore();

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    const group = groupRef.current;

    let targetHeight = 0;
    if (pieceType === "beagle") {
      if (isSelected && !isMoving) {
        targetHeight = ANIMATION_CONFIG.selectionHeight;
      } else if (isHovered && !isMoving) {
        targetHeight = ANIMATION_CONFIG.hoverHeight;
      }
    }

    const heightDiff = targetHeight - currentHeightRef.current;
    if (Math.abs(heightDiff) > THRESHOLDS.HEIGHT) {
      currentHeightRef.current = damp(
        currentHeightRef.current,
        targetHeight,
        SMOOTH_SPEED.HEIGHT,
        delta
      );
    } else {
      currentHeightRef.current = targetHeight;
    }

    // Movement animation
    if (animationId) {
      const animation = getAnimatingPiece(animationId);
      if (animation) {
        const progress = calculateProgress(
          animation.startTime,
          animation.duration,
          performance.now()
        );

        animationProgressRef.current = progress;

        let newPos: Position3D;

        if (animation.isCapture) {
          newPos = interpolateJumpPosition(
            animation.from,
            animation.to,
            progress,
            ANIMATION_CONFIG.jumpHeight,
            easings.easeInOutCubic
          );
        } else {
          newPos = interpolatePosition(
            animation.from,
            animation.to,
            progress,
            easings.easeOutCubic
          );
        }

        group.position.x = newPos.x;
        group.position.y = newPos.y;
        group.position.z = newPos.z;

        if (!wasAnimatingRef.current) {
          wasAnimatingRef.current = true;
          startRotationYRef.current = group.rotation.y;
          spinAccumulatorRef.current = 0;
          setIsMoving(true);
        }

        const rotationProgress = easings.easeOutCubic(
          Math.min(progress * 2, 1)
        );
        group.rotation.y = startRotationYRef.current * (1 - rotationProgress);

        const tiltAmount = Math.sin(progress * Math.PI) * 0.05;
        group.rotation.z = tiltAmount;

        if (progress >= 1) {
          wasAnimatingRef.current = false;
          animationProgressRef.current = 0;
          setIsMoving(false);
          completeAnimation(animationId);

          group.position.x = animation.to.x;
          group.position.y = currentHeightRef.current;
          group.position.z = animation.to.z;
          group.rotation.y = 0;
          group.rotation.z = 0;
          spinAccumulatorRef.current = 0;
        }

        return;
      }
    }

    // Idle state
    group.position.x = targetWorldPos.x;
    group.position.y = currentHeightRef.current;
    group.position.z = targetWorldPos.z;

    if (pieceType === "beagle" && (isSelected || isHovered)) {
      const spinSpeed = isSelected ? 1.0 : 0.5;
      spinAccumulatorRef.current += delta * spinSpeed;
      targetRotationYRef.current = spinAccumulatorRef.current;
    } else {
      targetRotationYRef.current = 0;
      spinAccumulatorRef.current = 0;
    }

    const rotDiff = targetRotationYRef.current - currentRotationYRef.current;
    if (Math.abs(rotDiff) > THRESHOLDS.ROTATION || isSelected || isHovered) {
      if (isSelected || isHovered) {
        currentRotationYRef.current = targetRotationYRef.current;
      } else {
        currentRotationYRef.current = damp(
          currentRotationYRef.current,
          0,
          SMOOTH_SPEED.ROTATION,
          delta
        );
      }
    }
    group.rotation.y = currentRotationYRef.current;

    const tiltTarget = 0;
    if (Math.abs(currentTiltZRef.current - tiltTarget) > THRESHOLDS.ROTATION) {
      currentTiltZRef.current = damp(
        currentTiltZRef.current,
        tiltTarget,
        SMOOTH_SPEED.TILT,
        delta
      );
    } else {
      currentTiltZRef.current = tiltTarget;
    }
    group.rotation.z = currentTiltZRef.current;
  });

  return { isMoving };
}
