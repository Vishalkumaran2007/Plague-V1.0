import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LearningProfile {
  name: string;
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  goals: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  subject: string;
}

export interface LearningStep {
  title: string;
  content: string;
  method: string;
  difficulty: string;
  estimatedTime: string;
  resourceLink?: string;
  resourceType?: 'youtube' | 'course' | 'article';
}

export interface LearningPath {
  subject: string;
  steps: LearningStep[];
}

export async function generateLearningPath(profile: LearningProfile): Promise<LearningPath> {
  const prompt = `Generate a personalized learning path for a student with the following profile:
  Name: ${profile.name}
  Learning Style: ${profile.learningStyle}
  Goals: ${profile.goals}
  Current Level: ${profile.level}
  Subject: ${profile.subject}

  The path should have 5 clear steps. Adapt the teaching method to their learning style.
  For each step, provide a relevant YouTube video link or a course link (e.g., Coursera, edX, or a high-quality article) that helps complete that specific step.
  Format the response as JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING, description: "Detailed explanation or instructions" },
                method: { type: Type.STRING, description: "How to learn this (e.g., 'Watch a video', 'Read a summary', 'Do a hands-on exercise')" },
                difficulty: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                resourceLink: { type: Type.STRING, description: "A relevant YouTube or course URL" },
                resourceType: { type: Type.STRING, enum: ["youtube", "course", "article"] }
              },
              required: ["title", "content", "method", "difficulty", "estimatedTime", "resourceLink", "resourceType"]
            }
          }
        },
        required: ["subject", "steps"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function adaptContent(currentStep: LearningStep, feedback: string): Promise<LearningStep> {
  const prompt = `The student is struggling with this learning step:
  Title: ${currentStep.title}
  Current Content: ${currentStep.content}
  
  Student Feedback: ${feedback}
  
  Please adapt the content to be more helpful, perhaps simplifying it or changing the teaching method.
  Also provide a relevant YouTube or course link for this adapted content.
  Format as JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          method: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          estimatedTime: { type: Type.STRING },
          resourceLink: { type: Type.STRING },
          resourceType: { type: Type.STRING, enum: ["youtube", "course", "article"] }
        },
        required: ["title", "content", "method", "difficulty", "estimatedTime", "resourceLink", "resourceType"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export interface ScheduleItem {
  time: string;
  activity: string;
  type: 'learning' | 'break' | 'focus' | 'rest';
}

export interface DailySchedule {
  day: string;
  items: ScheduleItem[];
}

export interface StudyNotes {
  title: string;
  introduction: string;
  keyConcepts: { concept: string; explanation: string; example: string; exampleCode?: string }[];
  detailedBreakdown: string;
  summary: string;
  suggestedSources: { name: string; url: string; type: string }[];
  mainExampleCode?: string;
}

export async function generateSchedule(profile: LearningProfile, goals: string): Promise<DailySchedule> {
  const prompt = `Generate a high-performance daily schedule for a student with the following profile:
  Name: ${profile.name}
  Learning Style: ${profile.learningStyle}
  Current Subject: ${profile.subject}
  Goals: ${goals}

  The schedule should be optimized for deep work and neural integration. Include specific times for learning, breaks, and focus sessions.
  Format the response as JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                activity: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["learning", "break", "focus", "rest"] }
              },
              required: ["time", "activity", "type"]
            }
          }
        },
        required: ["day", "items"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateStudyNotes(subject: string, level: string): Promise<StudyNotes> {
  const prompt = `Generate comprehensive, high-quality study notes for the following module:
  Subject: ${subject}
  Level: ${level}

  The notes must be extremely detailed, covering the full course scope for this module.
  Include:
  1. A clear introduction.
  2. Key concepts with detailed explanations, practical examples, and relevant code snippets (if applicable).
  3. A deep-dive breakdown of the topic.
  4. A concise summary.
  5. At least 3 up-to-date and accessible external sources (YouTube, articles, or courses) with their URLs.
  6. A main comprehensive code example that demonstrates the module's core concepts.

  Format the response as JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          introduction: { type: Type.STRING },
          keyConcepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                concept: { type: Type.STRING },
                explanation: { type: Type.STRING },
                example: { type: Type.STRING },
                exampleCode: { type: Type.STRING, description: "Relevant code snippet for this concept" }
              },
              required: ["concept", "explanation", "example"]
            }
          },
          detailedBreakdown: { type: Type.STRING, description: "Extremely detailed breakdown of the module" },
          summary: { type: Type.STRING },
          suggestedSources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                url: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ["name", "url", "type"]
            }
          },
          mainExampleCode: { type: Type.STRING, description: "Comprehensive code example for the module" }
        },
        required: ["title", "introduction", "keyConcepts", "detailedBreakdown", "summary", "suggestedSources"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
