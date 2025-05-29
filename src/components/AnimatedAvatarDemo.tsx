import React, { Suspense } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Stage } from '@react-three/drei';

const AVATAR_URL = '/bro.glb';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #ff5ecd 0%, #7f5eff 30%, #2ee8ff 70%, #2fff8d 100%);
    min-height: 100vh;
  }
`;

const Centered = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff5ecd 0%, #7f5eff 30%, #2ee8ff 70%, #2fff8d 100%);
`;

const Card = styled.div`
  background: rgba(255,255,255,0.13);
  border-radius: 2.5rem;
  box-shadow: 0 8px 48px #7f5eff44;
  padding: 40px 48px 32px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  color: #fff;
  font-size: 2.8rem;
  font-weight: 900;
  margin-bottom: 12px;
  letter-spacing: 1px;
  text-shadow: 0 4px 32px #ff5ecd33;
`;

const Subtitle = styled.h2`
  color: #e0b7ff;
  font-size: 1.25rem;
  font-weight: 400;
  margin-bottom: 32px;
  text-align: center;
`;

function AnimatedAvatar() {
  const { scene, animations } = useGLTF(AVATAR_URL);
  const { actions } = useAnimations(animations, scene);
  React.useEffect(() => {
    if (actions && animations.length > 0) {
      actions[animations[0].name]?.reset().fadeIn(0.4).play();
    }
    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, animations]);
  return <primitive object={scene} scale={1.4} position={[0, -1.1, 0]} />;
}

const AnimatedAvatarDemo: React.FC = () => (
  <>
    <GlobalStyle />
    <Centered>
      <Card>
        <Title>Stunning Animated Avatar</Title>
        <Subtitle>Meet your AI match in a next-gen immersive dating experience.<br />This is a speculative demo of the avatar UI and animation.</Subtitle>
        <Canvas camera={{ position: [0, 1.2, 2.6], fov: 38 }} style={{ background: 'transparent', width: 480, height: 600, borderRadius: 32, boxShadow: '0 8px 48px #7f5eff33' }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 4, 2]} intensity={0.7} />
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.6} shadows={{ type: 'contact', opacity: 1, blur: 1.5, far: 10 }}>
              <AnimatedAvatar />
            </Stage>
          </Suspense>
          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>
      </Card>
    </Centered>
  </>
);

export default AnimatedAvatarDemo;

