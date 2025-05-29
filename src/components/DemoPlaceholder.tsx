import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #232526 0%, #3fa3ff 100%);
    min-height: 100vh;
  }
`;

const Centered = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #232526 0%, #3fa3ff 100%);
`;

const Title = styled.h1`
  color: #fff;
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 18px;
  letter-spacing: 1px;
  text-shadow: 0 4px 32px #3fa3ff33;
`;

const Subtitle = styled.h2`
  color: #b1d4f6;
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 32px;
  text-align: center;
`;

const DemoPlaceholder: React.FC = () => (
  <>
    <GlobalStyle />
    <Centered>
      <Title>XRCupid Simulation</Title>
      <Subtitle>Simulation Demo Coming Soon!<br />Stay tuned for a stunning AI avatar experience.</Subtitle>
    </Centered>
  </>
);

export default DemoPlaceholder;
