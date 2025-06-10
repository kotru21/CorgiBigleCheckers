// src/components/Board3D/PieceMesh.jsx
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import React from "react";
import { usePieceAnimations } from "../../hooks/usePieceAnimations";
import { useGLTF, Sparkles } from "@react-three/drei";
import { GAME_MODES } from "../../models/Constants";
import * as THREE from "three";

// Кешируем материалы для повторного использования
const beagleMaterial = new THREE.MeshStandardMaterial({
  color: "#FFD700",
  roughness: 0.4,
  metalness: 0.3,
});

const corgiMaterial = new THREE.MeshStandardMaterial({
  color: "#FF8C00",
  roughness: 0.4,
  metalness: 0.3,
});

const crownMaterial = new THREE.MeshStandardMaterial({
  color: "#FFD700",
  roughness: 0.2,
  metalness: 0.8,
});

// Кеш моделей для предотвращения многократной загрузки
const modelCache = {};

export function PieceMesh({
  type,
  position,
  isKing,
  onClick,
  isSelected,
  gameMode,
}) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { currentHeight } = usePieceAnimations(isSelected);

  // Всегда загружаем модели (исправляем проблему с хуками)
  const { scene: pieceScene } = useGLTF(`/models/${type}.glb`);
  const { scene: crownScene } = useGLTF("/models/crown.glb");

  // Кешируем модели
  if (!modelCache[type]) {
    modelCache[type] = pieceScene.clone();
    // Оптимизация материалов для всей модели
    modelCache[type].traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = type === "beagle" ? beagleMaterial : corgiMaterial;
      }
    });
  }

  if (!modelCache["crown"]) {
    modelCache["crown"] = crownScene.clone();
    // Оптимизация материалов короны
    modelCache["crown"].traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = crownMaterial;
      }
    });
  }
  // Оптимизированная анимация
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = currentHeight;

      // Анимация вращения только для выбранных биглей
      if ((hovered || isSelected) && type === "beagle") {
        groupRef.current.rotation.y += delta * (isSelected ? 1.0 : 0.5);
      }

      // Упрощенные эффекты для режима вечеринки
      if (gameMode === GAME_MODES.PARTY_MODE) {
        // Только легкое покачивание, без сложных вычислений
        if (isSelected || hovered) {
          groupRef.current.rotation.z =
            Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
      }
    }
  });

  // Масштаб для разных типов собак
  const scale = type === "corgi" ? 0.4 : 0.43;

  // Обработчик клика - игнорируем клики на корги
  const handleClick = (e) => {
    // Прерываем обработку события, чтобы оно не распространялось
    e.stopPropagation();

    // Активируем обработку клика только для биглей
    if (type === "beagle") {
      onClick();
    }
  };

  // Вычисляем поворот для модели
  const modelRotation = type === "beagle" ? [0, 11, 0] : [0, 0, 0];

  return (
    <group
      position={[position[0], position[1], position[2]]}
      ref={groupRef}
      scale={hovered && type === "beagle" ? scale * 1.1 : scale}>
      {/* Хитбокс для кликов - обрабатывает только клики на биглей */}
      <mesh
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          // Наведение активно только для биглей
          if (type === "beagle") {
            setHovered(true);
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        visible={false}>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Модель фигуры с поворотом для биглей */}
      <primitive
        object={modelCache[type].clone()}
        position={[0, -0.1, 0]}
        rotation={modelRotation} // Применяем поворот
        scale={3}
      />
      {/* Корона для королей */}
      {isKing && (
        <primitive
          object={modelCache["crown"].clone()}
          position={[0, 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.03}
        />
      )}
      {/* Свечение только для биглей */}
      {(isSelected || hovered) && type === "beagle" && (
        <pointLight
          position={[0, 0.5, 0]}
          intensity={isSelected ? 0.4 : 0.2}
          color="#FFD700"
          distance={1}
        />
      )}{" "}
      {/* Упрощенные светящиеся эффекты для режима вечеринки */}
      {gameMode === GAME_MODES.PARTY_MODE && (isSelected || hovered) && (
        <>
          {/* Только одно дополнительное освещение для выбранных фигур */}
          <pointLight
            position={[0, 0.8, 0]}
            intensity={0.4}
            color={type === "beagle" ? "#00BFFF" : "#FF69B4"}
            distance={1.8}
          />
        </>
      )}
    </group>
  );
}

// Предзагрузка моделей для оптимизации
useGLTF.preload("/models/beagle.glb");
useGLTF.preload("/models/corgi.glb");
useGLTF.preload("/models/crown.glb");
