import { GoogleGenAI, Modality } from "@google/genai";

// Fix: Initialize the GoogleGenAI client with a named apiKey object.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert a File object to a GoogleGenerativeAI.Part object.
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result includes the Base64 prefix 'data:image/jpeg;base64,', remove it.
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Or handle error appropriately
      }
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

// Helper to convert a base64 string to a GoogleGenerativeAI.Part object.
const base64ToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const enhanceImage = async (imageFile: File): Promise<string> => {
  const model = 'gemini-2.5-flash-image-preview';
  const imagePart = await fileToGenerativePart(imageFile);
  const prompt = `
    You are a silent, AI-powered image enhancement tool. Your ONLY task is to take the provided image of a room and improve its quality.
    - **Actions:** Upscale, sharpen, denoise, and perform professional color and lighting correction.
    - **Strict Rule:** The content, objects, and structure of the room MUST remain IDENTICAL. Do not add, remove, or change anything.
    - **Output:** Your output MUST be ONLY the enhanced image. Do not provide any text, confirmation, or description.
    `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT], // Required by the model
      },
    });

    // Find the first image part in the response and return it.
    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData?.data
    );

    if (imagePartResponse?.inlineData?.data) {
        return imagePartResponse.inlineData.data;
    }

    // If no image part is found, throw a specific error.
    throw new Error("Model did not return an enhanced image.");

  } catch (error) {
    console.error("Error enhancing image:", error);
    // If enhancement fails for any reason, return the original image as a fallback
    // to prevent the entire process from breaking.
    const originalImagePart = await fileToGenerativePart(imageFile);
    return originalImagePart.inlineData.data;
  }
};


export const generateDecorIdeas = async (
  roomImage: File,
  decorImages: File[],
  stylePrompt: string
): Promise<string> => {
  // Fix: Use the correct model for image editing/composition as per guidelines.
  const model = 'gemini-2.5-flash-image-preview';

  const roomImagePart = await fileToGenerativePart(roomImage);
  const decorImageParts = await Promise.all(decorImages.map(fileToGenerativePart));

  const prompt = `
    You are an expert interior designer AI specializing in photo-realistic virtual staging.
    Your task is to integrate the provided decor items into the room image, following the user's style prompt precisely.

    **Crucial Rule: You MUST NOT alter the room's fundamental structure.** 
    - Do NOT change the position of walls, doors, windows, or any permanent fixtures.
    - Do NOT change the flooring or ceiling.
    - The room's layout, perspective, and architecture must remain identical to the original "room image".
    - Your role is to add or replace movable decor items, not to remodel the space.

    Based on the user's style prompt of "${stylePrompt}", realistically place the provided decor items into the room. 
    
    **Output ONLY the new image.** Do not output any text or description.
  `;

  const contents = {
    parts: [
      { text: "Here is the image of the room:" },
      roomImagePart,
      { text: "Here are the decor items to incorporate:" },
      ...decorImageParts,
      { text: prompt },
    ],
  };

  try {
    // Fix: Use ai.models.generateContent for API calls.
    const response = await ai.models.generateContent({
      model,
      contents,
      // Fix: responseModalities must be included for image output with this model.
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    const candidate = response.candidates?.[0];
    let image = "";

    if (candidate) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                image = part.inlineData.data;
                break; // Found the image, no need to continue
            }
        }
    }

    if (!image) {
      throw new Error("The model did not return an image. Please try refining your prompt.");
    }
    
    return image;

  } catch (error) {
    console.error("Error generating decor ideas:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate design: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the design.");
  }
};

export const generateCommentary = async (
  originalImage: File,
  generatedImage: string, // base64 string
  stylePrompt: string
): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const originalImagePart = await fileToGenerativePart(originalImage);
    const generatedImagePart = base64ToGenerativePart(generatedImage, 'image/png'); 
    
    const prompt = `
      You are an expert interior design commentator.
      You will be given a "before" image of a room and an "after" image with new decor.
      The user's style goal was: "${stylePrompt}".

      Your task is to provide a brief, cheerful audio commentary (around 3-4 sentences) that compares the two images.
      - **Start** by acknowledging the transformation.
      - **Highlight** 2-3 specific, positive changes (e.g., "Notice how the new velvet armchair adds a touch of luxury..." or "The addition of plants brings so much life and color to the space.").
      - **Conclude** with a summary of the new mood or feeling of the room.
      - Keep the tone inspiring and friendly. Do not use markdown or formatting.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    {text: "Before image:"},
                    originalImagePart,
                    {text: "After image:"},
                    generatedImagePart,
                    {text: prompt}
                ]
            }
        });
        
        return response.text;
        
    } catch (error) {
        console.error("Error generating commentary:", error);
        return "Here is your beautiful new room design, created just for you!"; // Fallback commentary
    }
};