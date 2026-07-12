import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function FloatingShape({ position, shape, color, speed = 1 }: {
  position: [number, number, number]
  shape: 'torus' | 'icosahedron' | 'octahedron'
  color: string
  speed?: number
}) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed
    ref.current.rotation.x = Math.sin(t * 0.5) * 0.3
    ref.current.rotation.y = Math.cos(t * 0.3) * 0.4
    ref.current.position.y = position[1] + Math.sin(t * 0.6) * 0.3
  })

  const geo = useMemo(() => {
    switch (shape) {
      case 'torus': return new THREE.TorusGeometry(0.4, 0.15, 16, 32)
      case 'icosahedron': return new THREE.IcosahedronGeometry(0.4, 0)
      case 'octahedron': return new THREE.OctahedronGeometry(0.4)
    }
  }, [shape])

  return (
    <mesh ref={ref} position={position} geometry={geo}>
      <MeshDistortMaterial
        color={color}
        transparent
        opacity={0.6}
        distort={0.2}
        speed={2}
        metalness={0.3}
        roughness={0.2}
      />
    </mesh>
  )
}

function Particles() {
  const count = 200
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [])

  const ref = useRef<THREE.Points>(null!)

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#6c63ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#6c63ff" />

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <FloatingShape position={[-3, 1, -2]} shape="torus" color="#6c63ff" speed={0.8} />
      </Float>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
        <FloatingShape position={[3, -1, -1]} shape="icosahedron" color="#00d4ff" speed={1} />
      </Float>
      <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.6}>
        <FloatingShape position={[-1.5, 2.5, -3]} shape="octahedron" color="#ff6b9d" speed={0.6} />
      </Float>
      <Float speed={1} rotationIntensity={0.4} floatIntensity={0.7}>
        <FloatingShape position={[2, -2, -4]} shape="torus" color="#8b5cf6" speed={1.2} />
      </Float>

      <Particles />
    </>
  )
}

export default function Scene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
      <Scene />
    </Canvas>
  )
}
