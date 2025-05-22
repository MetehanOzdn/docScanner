import { useState } from "react";

// Basit bir global sayaç store'u (Context veya başka bir state yönetimi ile genişletilebilir)
let globalCount = 0;
export function useGlobalCounter() {
    const [count, setCount] = useState(globalCount);
    const increment = () => setCount((c) => {
        globalCount = c + 1;
        return globalCount;
    });
    return { count, increment };
} 