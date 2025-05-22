import React from "react";

// Tekrar kullanılabilir bir buton bileşeni
export default function ExampleButton({ children, onClick }) {
    return (
        <button onClick={onClick} style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>
            {children}
        </button>
    );
} 