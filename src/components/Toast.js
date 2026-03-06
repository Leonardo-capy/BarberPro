import React from 'react';

function Toast({ show, message, success }) {
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}>
      <div
        style={{
          padding: '15px 25px',
          borderRadius: '10px',
          color: success ? 'black' : 'white',
          fontWeight: 'bold',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.5s ease-in-out',
          background: success ? 'linear-gradient(45deg, #00ffd5, #00aaff)' : '#ff3c3c'
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default Toast;