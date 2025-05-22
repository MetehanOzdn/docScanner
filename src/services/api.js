// Basit bir API çağrısı örneği
export async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Veri alınamadı');
    return response.json();
} 