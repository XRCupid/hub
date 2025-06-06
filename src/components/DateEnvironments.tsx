import React from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

interface DateEnvironmentProps {
  environment: string;
}

export const DateEnvironment: React.FC<DateEnvironmentProps> = ({ environment }) => {
  // Common elements for all environments
  const CommonElements = () => (
    <>
      {/* Table */}
      <group position={[0, -0.5, 0]}>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.05, 32]} />
          <meshStandardMaterial color="#654321" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.8, 16]} />
          <meshStandardMaterial color="#3E2723" roughness={0.5} />
        </mesh>
      </group>
    </>
  );

  switch (environment) {
    case 'wine-bar':
      return (
        <>
          {/* Wine Bar Environment */}
          <ambientLight intensity={0.2} color="#ff9966" />
          <directionalLight position={[5, 8, 5]} intensity={0.4} color="#ffaa88" castShadow />
          <pointLight position={[-3, 2, -2]} intensity={0.5} color="#ff6633" />
          <pointLight position={[3, 2, -2]} intensity={0.5} color="#ff7744" />
          
          <group>
            {/* Dark floor */}
            <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#1a0f0a" roughness={0.9} />
            </mesh>
            
            {/* Dark walls */}
            <mesh position={[0, 3, -5]} receiveShadow>
              <planeGeometry args={[20, 8]} />
              <meshStandardMaterial color="#2d1810" roughness={0.9} />
            </mesh>
            
            {/* Wine glasses */}
            <group position={[-0.3, 0.85, 0.2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.03, 0.01, 0.12, 16]} />
                <meshStandardMaterial color="#330000" transparent opacity={0.8} />
              </mesh>
            </group>
            <group position={[0.3, 0.85, -0.2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.03, 0.01, 0.12, 16]} />
                <meshStandardMaterial color="#330000" transparent opacity={0.8} />
              </mesh>
            </group>
            
            {/* Candle */}
            <group position={[0, 0.8, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
                <meshStandardMaterial color="#ffffcc" emissive="#ffaa00" emissiveIntensity={0.5} />
              </mesh>
              <pointLight position={[0, 0.05, 0]} intensity={0.3} color="#ff9900" distance={2} />
            </group>
            
            <CommonElements />
          </group>
          <fog attach="fog" args={['#1a0f0a', 5, 15]} />
        </>
      );

    case 'outdoor-cafe':
      return (
        <>
          {/* Outdoor Cafe Environment */}
          <ambientLight intensity={0.6} color="#ffffee" />
          <directionalLight position={[5, 10, 5]} intensity={0.8} color="#ffffff" castShadow />
          
          <group>
            {/* Stone floor */}
            <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#8B7355" roughness={0.9} />
            </mesh>
            
            {/* Sky backdrop */}
            <mesh position={[0, 10, -10]}>
              <planeGeometry args={[40, 20]} />
              <meshBasicMaterial color="#87CEEB" />
            </mesh>
            
            {/* Umbrella */}
            <group position={[0, 2.5, 0]}>
              <mesh castShadow>
                <coneGeometry args={[1.5, 0.5, 8]} />
                <meshStandardMaterial color="#ff6b6b" side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, -1.5, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
                <meshStandardMaterial color="#8B4513" />
              </mesh>
            </group>
            
            {/* Plants */}
            <group position={[-2, 0, -2]}>
              <mesh castShadow>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color="#228B22" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.3, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.3, 8]} />
                <meshStandardMaterial color="#8B4513" />
              </mesh>
            </group>
            
            <CommonElements />
          </group>
        </>
      );

    case 'bookstore-cafe':
      return (
        <>
          {/* Bookstore Cafe Environment */}
          <ambientLight intensity={0.5} color="#ffeedd" />
          <directionalLight position={[5, 8, 5]} intensity={0.5} color="#ffffee" castShadow />
          <pointLight position={[-3, 3, -2]} intensity={0.3} color="#ffcc99" />
          
          <group>
            {/* Wood floor */}
            <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#8B6F47" roughness={0.7} />
            </mesh>
            
            {/* Bookshelf wall */}
            <mesh position={[0, 3, -5]} receiveShadow>
              <planeGeometry args={[20, 8]} />
              <meshStandardMaterial color="#654321" roughness={0.9} />
            </mesh>
            
            {/* Book stacks */}
            <group position={[-3, 1, -4.5]}>
              {[0, 0.5, 1, 1.5, 2, 2.5].map((y, i) => (
                <mesh key={i} position={[0, y, 0]} castShadow>
                  <boxGeometry args={[1.5, 0.4, 0.3]} />
                  <meshStandardMaterial color={i % 2 ? '#8B4513' : '#A0522D'} />
                </mesh>
              ))}
            </group>
            
            {/* Coffee cups on table */}
            <mesh position={[-0.3, 0.8, -0.2]} castShadow>
              <cylinderGeometry args={[0.04, 0.03, 0.08, 16]} />
              <meshStandardMaterial color="#D2691E" roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0.8, 0.2]} castShadow>
              <cylinderGeometry args={[0.04, 0.03, 0.08, 16]} />
              <meshStandardMaterial color="#8B4513" roughness={0.3} />
            </mesh>
            
            {/* Books on table */}
            <mesh position={[0, 0.78, 0]} rotation={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[0.2, 0.03, 0.15]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, 0.81, 0]} rotation={[0, -0.2, 0]} castShadow>
              <boxGeometry args={[0.18, 0.03, 0.13]} />
              <meshStandardMaterial color="#2F4F4F" />
            </mesh>
            
            {/* Reading lamp */}
            <group position={[1.5, 0.6, -1]}>
              <mesh>
                <coneGeometry args={[0.2, 0.3, 8]} />
                <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
              </mesh>
              <pointLight intensity={0.4} color="#FFD700" distance={3} />
            </group>
            
            <CommonElements />
          </group>
          <fog attach="fog" args={['#D2B48C', 8, 20]} />
        </>
      );

    default:
      // Coffee Shop (default)
      return (
        <>
          {/* Coffee Shop Lighting */}
          <ambientLight intensity={0.4} color="#ffeedd" />
          <directionalLight 
            position={[5, 8, 5]} 
            intensity={0.6} 
            color="#ffeecc"
            castShadow 
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-3, 3, -2]} intensity={0.3} color="#ff9966" />
          <pointLight position={[3, 3, -2]} intensity={0.3} color="#ffaa77" />
          
          <group>
            {/* Floor */}
            <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#8B6F47" roughness={0.8} />
            </mesh>
            
            {/* Back Wall */}
            <mesh position={[0, 3, -5]} receiveShadow>
              <planeGeometry args={[20, 8]} />
              <meshStandardMaterial color="#D2B48C" roughness={0.9} />
            </mesh>
            
            {/* Side Walls */}
            <mesh position={[-10, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
              <planeGeometry args={[20, 8]} />
              <meshStandardMaterial color="#DEB887" roughness={0.9} />
            </mesh>
            <mesh position={[10, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
              <planeGeometry args={[20, 8]} />
              <meshStandardMaterial color="#DEB887" roughness={0.9} />
            </mesh>
            
            {/* Coffee cups on table */}
            <mesh position={[-0.3, 0.3, -0.2]} castShadow>
              <cylinderGeometry args={[0.04, 0.03, 0.08, 16]} />
              <meshStandardMaterial color="#D2691E" roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0.3, 0.2]} castShadow>
              <cylinderGeometry args={[0.04, 0.03, 0.08, 16]} />
              <meshStandardMaterial color="#8B4513" roughness={0.3} />
            </mesh>
            
            {/* Small plant */}
            <group position={[0, 0.8, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color="#228B22" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
                <meshStandardMaterial color="#8B4513" />
              </mesh>
            </group>
            
            {/* Window Light Effect */}
            <mesh position={[-4, 2, -4.9]} rotation={[0, 0.3, 0]}>
              <planeGeometry args={[3, 4]} />
              <meshBasicMaterial color="#FFFFEE" opacity={0.3} transparent />
            </mesh>
            
            {/* Menu Board */}
            <mesh position={[4, 2.5, -4.9]} castShadow>
              <boxGeometry args={[2, 1.5, 0.1]} />
              <meshStandardMaterial color="#2F1B14" />
            </mesh>
            
            {/* Hanging Lights */}
            <group position={[0, 3.5, 0]}>
              <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial 
                  color="#FFEEAA" 
                  emissive="#FFEEAA" 
                  emissiveIntensity={0.5} 
                />
              </mesh>
              <pointLight intensity={0.4} color="#FFEEAA" distance={5} />
            </group>
            
            <CommonElements />
          </group>
          <fog attach="fog" args={['#F5DEB3', 5, 15]} />
        </>
      );
  }
};
