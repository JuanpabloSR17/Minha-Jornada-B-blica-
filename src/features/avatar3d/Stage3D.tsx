import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';
import { useTheme } from '@/theme/ThemeProvider';
import type { Look3D } from './look3d';

/** Modo de luz do palco: guarda-roupa (neutra, para comparar peças) ou acampamento (lua + fogueira). */
export type Lighting3D = 'neutral' | 'camp';

const MODEL = require('../../../assets/models/viajante.glb');

/** Estado do palco exposto para testes no navegador (carregado, quadros desenhados, ângulo). */
type Probe = { loaded: boolean; frames: number; angle: number; clip: string; error?: string };
const probe = (): Probe => {
  const g = globalThis as { __jb3d?: Probe };
  g.__jb3d ??= { loaded: false, frames: 0, angle: 0, clip: '' };
  return g.__jb3d;
};

let cache: Promise<GLTF> | null = null;
function loadModel(): Promise<GLTF> {
  cache ??= (async () => {
    const asset = Asset.fromModule(MODEL);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    return new GLTFLoader().loadAsync(uri);
  })();
  return cache;
}

function Lights({ mode, reduceMotion }: { mode: Lighting3D; reduceMotion: boolean }) {
  const fire = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!fire.current) return;
    const t = clock.getElapsedTime();
    // fogueira tremulando (fixa com movimento reduzido)
    fire.current.intensity = reduceMotion ? 9 : 9 + Math.sin(t * 9.3) * 1.0 + Math.sin(t * 13.7 + 1.3) * 0.7 + Math.sin(t * 3.1) * 0.5;
  });
  if (mode === 'camp') {
    return (
      <>
        <hemisphereLight args={['#5b6db8', '#2a1a14', 0.9]} />
        {/* lua: azulada, alta, atrás e à esquerda (contorno frio) e um preenchimento suave da frente */}
        <directionalLight color="#b4c4ff" intensity={2.4} position={[-3, 5, -2.5]} />
        <directionalLight color="#8a9ee0" intensity={0.9} position={[-2, 2.5, 3]} />
        {/* fogueira: à frente e à direita, baixa e quente */}
        <pointLight ref={fire} color="#ff9a48" intensity={9} distance={8} decay={1.4} position={[1.3, 0.55, 1.2]} />
      </>
    );
  }
  return (
    <>
      <hemisphereLight args={['#fff7ea', '#4a4038', 0.95]} />
      <directionalLight color="#ffffff" intensity={2.1} position={[2, 4, 3]} />
      <directionalLight color="#e8eeff" intensity={0.65} position={[-3, 2, 2]} />
      <directionalLight color="#ffffff" intensity={0.9} position={[0, 3, -4]} />
    </>
  );
}

function Traveler({ look, angle, reduceMotion }: { look: Look3D; angle: number; reduceMotion: boolean }) {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const group = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const { invalidate } = useThree();

  useEffect(() => {
    let alive = true;
    loadModel().then(
      (g) => { if (alive) { setGltf(g); probe().loaded = true; invalidate(); } },
      (e) => { probe().error = String(e); },
    );
    return () => { alive = false; };
  }, [invalidate]);

  // aparência e peças com os dados da conta
  useEffect(() => {
    if (!gltf) return;
    gltf.scene.traverse((o) => {
      const name = o.name as keyof Look3D['meshes'];
      if (name in look.meshes) o.visible = look.meshes[name];
      const m = (o as THREE.Mesh).material;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
        const std = mat as THREE.MeshStandardMaterial;
        if (std.name === 'skin') std.color.set(look.skin);
        if (std.name === 'hair' || std.name === 'brows') std.color.set(look.hairColor);
      }
    });
  }, [gltf, look]);

  // animação de repouso: com o cajado, o braço direito o segura
  useEffect(() => {
    if (!gltf) return;
    const mx = new THREE.AnimationMixer(gltf.scene);
    const clip = THREE.AnimationClip.findByName(gltf.animations, look.meshes.staff ? 'idle_staff' : 'idle');
    if (clip) {
      const action = mx.clipAction(clip);
      action.play();
      probe().clip = clip.name;
      // movimento reduzido: pose estática no meio do ciclo
      if (reduceMotion) mx.setTime(clip.duration * 0.35);
      else mx.update(0);
    }
    mixer.current = mx;
    return () => { mx.stopAllAction(); mixer.current = null; };
  }, [gltf, look.meshes.staff, reduceMotion]);

  useFrame((_, dt) => {
    if (!reduceMotion) mixer.current?.update(Math.min(dt, 0.05));
    const g = group.current;
    if (g) {
      // gira suavemente até o ângulo pedido (imediato com movimento reduzido)
      const diff = Math.atan2(Math.sin(angle - g.rotation.y), Math.cos(angle - g.rotation.y));
      g.rotation.y = reduceMotion ? angle : g.rotation.y + diff * Math.min(1, dt * 8);
      probe().angle = g.rotation.y;
    }
    probe().frames += 1;
  });

  return (
    <group ref={group}>
      {gltf ? <primitive object={gltf.scene} /> : null}
      {/* sombra de contato no chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[0.42, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Palco 3D do viajante: GLB com esqueleto, materiais iluminados em tempo real, animação de repouso e
 * rotação por arraste (ou pelos ângulos frente/lado/costas). Fundo transparente para o acampamento.
 */
export function Stage3D({
  look,
  angle,
  onAngle,
  lighting,
  height,
  background,
  style,
  accessibilityLabel,
}: {
  look: Look3D;
  angle: number;
  onAngle: (a: number) => void;
  lighting: Lighting3D;
  height: number;
  background?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}) {
  const { reduceMotion } = useTheme();
  const start = useRef(angle);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => { start.current = angleRef.current; },
        onPanResponderMove: (_, g) => onAngleRef.current(start.current + g.dx * 0.012),
      }),
    [],
  );
  const angleRef = useRef(angle);
  angleRef.current = angle;
  const onAngleRef = useRef(onAngle);
  onAngleRef.current = onAngle;

  return (
    <View style={[styles.stage, { height, backgroundColor: background ?? 'transparent' }, style]} {...pan.panHandlers}
      accessible accessibilityRole="adjustable" accessibilityLabel={accessibilityLabel} testID="stage-3d">
      <Canvas
        camera={{ position: [0, 1.0, 4.4], fov: 30, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 0.92, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={StyleSheet.absoluteFill}
      >
        <Suspense fallback={null}>
          <Lights mode={lighting} reduceMotion={reduceMotion} />
          <Traveler look={look} angle={angle} reduceMotion={reduceMotion} />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: '100%', overflow: 'hidden', borderRadius: 16 },
});
