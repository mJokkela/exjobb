import { SparePart } from './types';


// const BASE_URL = 'http://localhost:3000/api';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export async function getSpareParts() {
  const res = await fetch(`${BASE_URL}/api/spare-parts`);
  return await res.json();
}

export async function getAppSettings() {
  const res = await fetch(`${BASE_URL}/api/app-settings`);
  return await res.json();
}

export async function insertSparePart(part: SparePart): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/spare-parts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(part),
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      throw new Error(data.error || 'Något gick fel vid uppdatering');
    }
  
    // obs: returnera data.message 
    return;
  }
  

export async function updateQuantity(
    id: string,
    newQty: number,
    reason?: string,
    message?: string
  ) {
    const res = await fetch(`${BASE_URL}/api/spare-parts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: newQty,
        reason,
        message
      }),
    });
  
    if (!res.ok) throw new Error('Failed to update quantity');
    return await res.json();
  }

//   export async function updatePart(part: SparePart): Promise<void> {
//   await fetch(`/api/spare-parts/${part.internalArticleNumber}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(part),
//   });
// }

export async function insertHistory(history: any) {
  const res = await fetch(`${BASE_URL}/api/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(history),
  });
  return await res.json();
}

export async function importParts(parts: any[]) {
  const res = await fetch(`${BASE_URL}/api/spare-parts/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parts }),
  });
  return await res.json();
}

export async function uploadImage(file: File, articleNumber: string): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('articleNumber', articleNumber);
  

  const res = await fetch(`${BASE_URL}/api/upload-image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Image upload failed');
  return await res.json(); // { imageUrl: 'https://...s3.amazonaws.com/...' }
}
  
  // export async function uploadLogo(file: File) {
  //   const formData = new FormData();
  //   formData.append('image', file);
  //   formData.append('articleNumber', 'LOGO'); // används bara för att matcha strukturen
  
  //   const res = await fetch(`${BASE_URL}/api/upload-image`, {
  //     method: 'POST',
  //     body: formData,
  //   });
  
  //   if (!res.ok) throw new Error('Logo upload failed');
  //   const { imageUrl } = await res.json();
  //   return imageUrl;
  // }
  
  export async function updateAppSettings(settings: { logoUrl: string }) {
    const res = await fetch(`${BASE_URL}/api/app-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  
    if (!res.ok) throw new Error('Failed to update settings');
  }
  
  export async function getPartHistory(articleNumber: string) {
     const res = await fetch(`${BASE_URL}/api/part-history/${encodeURIComponent(articleNumber)}`);
    if (!res.ok) throw new Error('Failed to fetch part history');
    return await res.json();
  }
  
  // export async function getFieldHistory(articleNumber: string) {
  //   const res = await fetch(`${BASE_URL}/api/field-history/${encodeURIComponent(articleNumber)}`);
  //   if (!res.ok) throw new Error('Failed to fetch field history');
  //   return await res.json();
  // }

  export async function deleteImage(imageUrl: string) {
    const res = await fetch(`${BASE_URL}/api/delete-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
  
    if (!res.ok) throw new Error('Image delete failed');
  }

  export async function deletePart(articleNumber: string) {
    const res = await fetch(`${BASE_URL}/api/spare-parts/${articleNumber}`, {
      method: 'DELETE',
    });
  
    if (!res.ok) throw new Error('Failed to delete part');
  }
  
  
  