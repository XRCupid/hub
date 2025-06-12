import React from 'react';

function AvatarDisplay({ imageUrl }) {
  if (!imageUrl) {
    return (
      <div style={styles.placeholder}>
        <p>No Avatar Image</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <img src={imageUrl} alt="NPC Avatar" style={styles.image} />
    </div>
  );
}

const styles = {
  container: {
    width: '300px', // Adjust as needed
    height: '300px', // Adjust as needed
    border: '1px solid #ccc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // To contain the image
    backgroundColor: '#f0f0f0', // Placeholder background
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain', // Or 'cover', depending on desired behavior
  },
  placeholder: {
    width: '300px',
    height: '300px',
    border: '1px solid #ccc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    color: '#777',
  }
};

export default AvatarDisplay;
