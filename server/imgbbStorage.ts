const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export function isImgBBConfigured(): boolean {
  return !!IMGBB_API_KEY;
}

interface ImgBBResponse {
  data: {
    id: string;
    url: string;
    display_url: string;
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export async function uploadToImgBB(base64Image: string, name?: string): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error("IMGBB_API_KEY not configured");
  }

  const formData = new FormData();
  formData.append("key", IMGBB_API_KEY);
  formData.append("image", base64Image);
  if (name) {
    formData.append("name", name);
  }

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.status}`);
  }

  const result: ImgBBResponse = await response.json();
  
  if (!result.success) {
    throw new Error("ImgBB upload failed");
  }

  return result.data.display_url;
}
