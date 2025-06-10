import { Suspense, useState, useRef, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  useTexture,
  Cloud,
  Sky,
  Sparkles,
} from "@react-three/drei";
import { PieceMesh } from "./PieceMesh";
import React from "react";
import { EMPTY } from "../../models/Constants";
import * as THREE from "three";

// Компонент доски
function Board({ renderBoardSquares }) {
  // Загружаем текстуры дерева из локальных файлов
  const woodTextures = useTexture({
    map: "/textures/wood_color.png",
    normalMap: "/textures/wood_normal.png",
    roughnessMap: "/textures/wood_roughness.jpg",
  });

  // Настраиваем текстуру для повторения
  React.useEffect(() => {
    Object.values(woodTextures).forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
    });
  }, [woodTextures]);

  // Создаём материал с текстурой дерева
  const woodMaterial = new THREE.MeshStandardMaterial({
    ...woodTextures,
    roughness: 0.8,
    metalness: 0.1,
    color: "#8B5A2B",
  });
  return (
    <group>
      <mesh position={[0, -0.1, 5.25]} receiveShadow castShadow>
        <boxGeometry args={[11, 0.3, 0.5]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.1, -5.25]} receiveShadow castShadow>
        <boxGeometry args={[11, 0.3, 0.5]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[5.25, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.3, 11]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[-5.25, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.3, 11]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>

      {renderBoardSquares()}
    </group>
  );
}

// Обновление компонента Sun для поддержки режимов производительности
function Sun() {
  const sunPosition = [100, 100, -100]; // Позиция солнца
  const { performanceMode } = useThree((state) => ({
    performanceMode: state.performance?.current,
  }));

  // Упрощенная версия для низкой производительности
  if (performanceMode === "low") {
    return (
      <directionalLight
        position={sunPosition}
        intensity={3}
        color="#FFFACD"
        castShadow
      />
    );
  }

  return (
    <group position={sunPosition}>
      {/* Основной диск солнца */}
      <mesh>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>

      {/* Внешнее свечение - отключаем для режима medium */}
      {performanceMode !== "medium" && (
        <Sparkles
          count={50}
          scale={[30, 30, 30]}
          size={6}
          speed={0.3}
          color="#FFFFE0"
          opacity={0.7}
        />
      )}

      {/* Лучи света от солнца */}
      <directionalLight
        position={[0, 0, 0]}
        intensity={3}
        color="#FFFACD"
        castShadow
        shadow-mapSize-width={performanceMode === "high" ? 2048 : 1024}
        shadow-mapSize-height={performanceMode === "high" ? 2048 : 1024}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
    </group>
  );
}

// Улучшенный компонент для динамической генерации облаков
function EnhancedClouds({ count = 80 }) {
  // Генерируем облака только один раз с помощью useMemo
  const clouds = useMemo(() => {
    // Функция для генерации случайного числа в диапазоне
    const randomRange = (min, max) => Math.random() * (max - min) + min;

    // Функция для генерации случайного целого числа
    const randomInt = (min, max) => Math.floor(randomRange(min, max));

    // Типы облаков с разными характеристиками
    const cloudTypes = [
      // Кучевые большие облака
      {
        args: [randomRange(8, 15), randomRange(4, 7), randomRange(2, 4)],
        width: randomRange(50, 700),
        depth: randomRange(2, 4),
        segments: randomInt(15, 25),
        opacity: randomRange(0.7, 0.9),
        speed: randomRange(0.05, 0.15),
        color: "#ffffff",
      },
      // Слоистые облака
      {
        args: [randomRange(10, 20), randomRange(2, 4), randomRange(1, 2)],
        width: randomRange(70, 710),
        depth: randomRange(1, 2),
        segments: randomInt(12, 18),
        opacity: randomRange(0.5, 0.7),
        speed: randomRange(0.03, 0.1),
        color: "#f5f5f5",
      },
      // Перистые облака (высокие и тонкие)
      {
        args: [randomRange(6, 12), randomRange(1.5, 3), randomRange(0.8, 1.5)],
        width: randomRange(60, 90),
        depth: randomRange(0.8, 1.5),
        segments: randomInt(8, 15),
        opacity: randomRange(0.3, 0.5),
        speed: randomRange(0.08, 0.2),
        color: "#fafafa",
      },
      // Грозовые облака (более темные и плотные)
      {
        args: [randomRange(9, 18), randomRange(5, 8), randomRange(2.5, 4)],
        width: randomRange(60, 90),
        depth: randomRange(3, 5),
        segments: randomInt(18, 28),
        opacity: randomRange(0.6, 0.8),
        speed: randomRange(0.04, 0.12),
        color: "#f0f0f0",
      },
    ];

    // Зоны расположения облаков
    const positions = [
      // Передняя область (Z положительная)
      {
        minX: -120,
        maxX: 120,
        minY: -5,
        maxY: 25,
        minZ: 35,
        maxZ: 120,
        count: Math.floor(count * 0.3),
        heightVariation: true, // Переменная высота
      },
      // Задняя область (Z отрицательная)
      {
        minX: -120,
        maxX: 120,
        minY: -5,
        maxY: 25,
        minZ: -120,
        maxZ: -35,
        count: Math.floor(count * 0.3),
        heightVariation: true,
      },
      // Левая область (X отрицательная)
      {
        minX: -120,
        maxX: -35,
        minY: -5,
        maxY: 25,
        minZ: -80,
        maxZ: 80,
        count: Math.floor(count * 0.2),
        heightVariation: true,
      },
      // Правая область (X положительная)
      {
        minX: 35,
        maxX: 120,
        minY: -5,
        maxY: 25,
        minZ: -80,
        maxZ: 80,
        count: Math.floor(count * 0.2),
        heightVariation: true,
      },
      // Высокие дальние облака (фон)
      {
        minX: -150,
        maxX: 150,
        minY: 30,
        maxY: 60,
        minZ: -150,
        maxZ: 150,
        count: Math.floor(count * 0.3),
        heightVariation: false,
      },
    ];

    // Генерируем группы облаков для каждой зоны
    return positions.flatMap((zone) => {
      return Array.from({ length: zone.count }).map((_, i) => {
        // Выбираем случайный тип облака
        const cloudType = cloudTypes[randomInt(0, cloudTypes.length)];

        // Определяем высоту с учетом флага вариации
        const y = zone.heightVariation
          ? randomRange(zone.minY, zone.maxY)
          : randomRange(zone.minY, zone.maxY) + Math.sin(i * 0.5) * 5; // Добавляем синусоиду для более плавного распределения

        // Параметры облаков с учетом выбранного типа
        const position = [
          randomRange(zone.minX, zone.maxX),
          y,
          randomRange(zone.minZ, zone.maxZ),
        ];

        // Насколько далеко от центра, тем меньше непрозрачность
        const distanceFromCenter = Math.sqrt(
          position[0] * position[0] + position[2] * position[2]
        );
        const fadeByDistance = Math.max(0, 1 - distanceFromCenter / 150);

        // Финальная непрозрачность с учетом расстояния
        const opacity = cloudType.opacity * fadeByDistance;

        // Размер облака с вариациями
        const width = cloudType.width * (0.7 + Math.random() * 0.6);

        // Вращение для разнообразия
        const rotation = [0, randomRange(0, Math.PI * 2), 0];

        return (
          <group
            key={`cloud-${i}-${zone.minX}`}
            position={position}
            rotation={rotation}>
            <Cloud
              args={cloudType.args}
              opacity={opacity}
              speed={cloudType.speed}
              width={width}
              depth={cloudType.depth}
              segments={cloudType.segments}
              color={cloudType.color}
            />
          </group>
        );
      });
    });
  }, [count]); // Зависимость только от количества облаков

  return <group>{clouds}</group>;
}

// Обновление функции PerformanceMonitor
function PerformanceMonitor({ onPerformanceChange }) {
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  const fps = useRef(60);
  const lastReportedMode = useRef("high");

  useFrame(() => {
    frameCount.current++;

    const now = Date.now();
    const elapsed = now - lastTime.current;

    // Обновляем FPS каждые 500мс для более частого обновления интерфейса
    if (elapsed > 500) {
      fps.current = Math.round((frameCount.current / elapsed) * 1000);

      // Определяем режим производительности
      let newMode = "high";
      if (fps.current < 20) {
        newMode = "low";
      } else if (fps.current < 40) {
        newMode = "medium";
      }

      // Всегда сообщаем родительскому компоненту обновленные данные FPS
      onPerformanceChange(fps.current, newMode);

      // Обновляем последний режим только при его изменении
      if (newMode !== lastReportedMode.current) {
        lastReportedMode.current = newMode;
      }

      // Сбрасываем счетчик
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}

// Компонент неба с динамическими облаками и солнцем
function SkyWithCloudsAndSun({ performanceMode }) {
  const skyRef = useRef();

  // Если включен режим производительности, вернем минимальную версию неба
  if (performanceMode === "low") {
    return (
      <>
        {/* Простая цветная сфера заменяет небо */}
        <mesh position={[0, 0, 0]} scale={500}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
        </mesh>

        {/* Упрощенный источник света вместо солнца */}
        <directionalLight
          position={[100, 100, -100]}
          intensity={3}
          color="#FFFACD"
          castShadow
        />
      </>
    );
  }

  // Средний режим - базовое небо без облаков
  if (performanceMode === "medium") {
    return (
      <>
        <Sky
          ref={skyRef}
          distance={450000}
          sunPosition={[100, 100, -100]}
          inclination={0.6}
          azimuth={0.25}
          rayleigh={0.15}
          turbidity={6}
          mieCoefficient={0.003}
          mieDirectionalG={0.9}
          exposure={1.5}
        />
        <Sun />
      </>
    );
  }

  // Полный режим с небом, солнцем и облаками
  return (
    <>
      <Sky
        ref={skyRef}
        distance={450000}
        sunPosition={[100, 100, -100]}
        inclination={0.6}
        azimuth={0.25}
        rayleigh={0.15}
        turbidity={6}
        mieCoefficient={0.003}
        mieDirectionalG={0.9}
        exposure={1.5}
      />
      <Sun />
      <EnhancedClouds count={100} />
    </>
  );
}

function Renderer() {
  const { gl } = useThree();

  React.useEffect(() => {
    //настройки рендеринга
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputEncoding = THREE.sRGBEncoding;
  }, [gl]);

  return null;
}

// Улучшенное окружение
function SimpleEnvironment() {
  return (
    <>
      <ambientLight intensity={0.8} color="#f5f9ff" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={15}
        color="#ffffff"
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#f0f8ff" />
    </>
  );
}

// Компонент для рендеринга содержимого внутри Canvas
function Board3DContent({
  board,
  onPieceSelect,
  selectedPiece,
  validMoves,
  onPerformanceData,
  piecesWithCaptures = [],
}) {
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [performanceMode, setPerformanceMode] = useState("high");

  // Загружаем текстуры для клеток на уровне компонента
  const darkSquareTexture = useTexture("/textures/dark_square.jpg");
  const lightSquareTexture = useTexture("/textures/light_square.jpg");

  // Настройка текстур
  React.useEffect(() => {
    [darkSquareTexture, lightSquareTexture].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
    });
  }, [darkSquareTexture, lightSquareTexture]);

  // Обработчик изменения производительности
  const handlePerformanceChange = (fps, mode) => {
    setPerformanceMode(mode);

    // Передаем информацию родительскому компоненту при каждом обновлении FPS
    if (onPerformanceData) {
      onPerformanceData(fps, mode);
    }
  };
  // Рендеринг клеток доски с международным узором (только темные клетки используются)
  const renderBoardSquares = () => {
    const squares = [];

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const isEven = (row + col) % 2 === 0;
        const isDarkSquare = !isEven; // Темные клетки - где используются шашки
        const isSelected =
          selectedPiece &&
          selectedPiece.row === row &&
          selectedPiece.col === col;
        const isValidMove =
          validMoves &&
          validMoves.some((move) => move.row === row && move.col === col);
        const isHovered =
          hoveredSquare &&
          hoveredSquare.row === row &&
          hoveredSquare.col === col;

        // Проверяем, есть ли фигура с обязательным захватом на этой клетке
        const hasCapturePiece = piecesWithCaptures.some(
          (piece) => piece.row === row && piece.col === col
        );

        // Создаём материалы с текстурами
        const material = new THREE.MeshStandardMaterial({
          map: isEven ? lightSquareTexture : darkSquareTexture,
          color: isEven ? "#E8D0AA" : "#774936",
          roughness: 0.7,
          metalness: 0.05,
        });

        // Модификация материала для особых состояний
        if (isSelected) {
          material.color.set("#66BB66");
        } else if (isValidMove) {
          material.color.set("#6699FF");
          material.transparent = true;
          material.opacity = 0.9;
        } else if (hasCapturePiece) {
          // Подсветка фигур с обязательными захватами красным цветом
          material.color.set("#FF6666");
          material.transparent = true;
          material.opacity = 0.8;
        } else if (isHovered) {
          if (isEven) {
            material.color.set("#F0DDB8");
          } else {
            material.color.set("#8A5A44");
          }
        }

        squares.push(
          <mesh
            key={`square-${row}-${col}`}
            position={[row - 4.5, -0.097, col - 4.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              // В международных шашках можем кликать только на темные клетки или если там есть фигуры
              if (isDarkSquare || isValidMove || board[row][col] !== EMPTY) {
                onPieceSelect(row, col);
              }
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredSquare({ row, col });
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredSquare(null);
            }}>
            <planeGeometry args={[0.95, 0.95]} />
            <primitive object={material} attach="material" />
          </mesh>
        );

        // Добавляем тонкую рамку вокруг клетки для улучшения вида доски
        squares.push(
          <mesh
            key={`border-${row}-${col}`}
            position={[row - 4.5, -0.096, col - 4.5]}
            rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial
              color={isEven ? "#774936" : "#E8D0AA"}
              opacity={0.3}
              transparent
            />
          </mesh>
        );
      }
    }

    return squares;
  };
  // Отдельная функция для рендеринга фигур
  const renderPieces = useMemo(() => {
    return board.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (cell === EMPTY) return null;

        // Определяем тип фигуры и является ли она королем
        const type = cell.includes("beagle") ? "beagle" : "corgi";
        const isKing = cell.includes("-king");

        return (
          <PieceMesh
            key={`piece-${rowIndex}-${colIndex}`}
            type={type}
            isKing={isKing}
            position={[rowIndex - 4.5, 0, colIndex - 4.5]}
            onClick={() => onPieceSelect(rowIndex, colIndex)}
            isSelected={
              selectedPiece &&
              selectedPiece.row === rowIndex &&
              selectedPiece.col === colIndex
            }
          />
        );
      })
    );
  }, [board, selectedPiece, onPieceSelect]); // Зависит только от изменений доски и выбора

  // рендеринг сцены
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 7]} fov={50} />
      <OrbitControls
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        maxDistance={12}
        minDistance={5}
      />
      <Renderer />
      <SimpleEnvironment />

      {/* Мониторинг производительности */}
      <PerformanceMonitor onPerformanceChange={handlePerformanceChange} />

      {/* Подвесной компонент для ленивой загрузки */}
      <Suspense fallback={null}>
        {/* Рендеринг доски */}
        <Board renderBoardSquares={renderBoardSquares} />
        <SkyWithCloudsAndSun performanceMode={performanceMode} />

        {/* тени */}
        <ContactShadows
          position={[0, -0.5, 0]}
          opacity={0.4}
          width={15}
          height={15}
          blur={1.5}
          far={4.5}
          resolution={256}
        />

        {/* Мемоизированные фигуры */}
        {renderPieces}
      </Suspense>

      {/* Настраиваем окружение с более солнечным пресетом */}
      <Environment preset="sunset" intensity={0.2} />
    </>
  );
}

// Экспортируемый компонент-обёртка
export function Board3D({
  board,
  onPieceSelect,
  selectedPiece,
  validMoves,
  onPerformanceData,
  piecesWithCaptures = [],
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]} // ограничиваем максимальный DPR для производительности
      performance={{ min: 0.5 }} // разрешаем Three.js понижать качество при низкой производительности
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}>
      <Board3DContent
        board={board}
        onPieceSelect={onPieceSelect}
        selectedPiece={selectedPiece}
        validMoves={validMoves}
        onPerformanceData={onPerformanceData}
        piecesWithCaptures={piecesWithCaptures}
      />
    </Canvas>
  );
}
