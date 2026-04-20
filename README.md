# PLAGUE – Personalized Learning Adaptive Guidance Engine  

AI-powered system that adapts learning paths based on student behavior, progress, and goals.

---

## Overview  
PLAGUE is a personalized learning platform designed to address diverse learning needs in Indian classrooms. It dynamically adjusts content difficulty, pace, and teaching methods using real-time student interaction data.


---

## Features  
- Personalized learning pathways  
- Real-time progress tracking  
- AI-driven content adaptation  
- Scalable for diverse classrooms  
- Fast and responsive user interface  

---

## Tech Stack  

**Frontend**  
- React (TypeScript)  
- Vite  
- CSS  

**Backend & Services**  
- Firebase (Authentication, Firestore, Hosting)  
- Modular service architecture  

**AI Integration**  
- Gemini API  

---

## How It Works  

1. User interacts with the platform  
2. Data is captured (accuracy, time, engagement)  
3. AI analyzes learning patterns  
4. System adapts content dynamically  


---

## Challenges  
- Handling limited initial student data  
- Maintaining low latency with AI responses  
- Designing adaptive difficulty balancing  
- Ensuring secure and scalable Firebase rules  

---

## Achievements  
- Built a full-stack AI-powered learning system  
- Implemented real-time personalization  
- Designed a scalable TypeScript-based architecture  
- Enabled adaptive learning within a lightweight application  

---

## Learnings  
- TypeScript improves maintainability in complex systems  
- Real-time adaptation requires efficient data flow design  
- AI effectiveness depends on context-aware responses  


---

## Future Work  
- Advanced analytics dashboard for educators  
- Reinforcement learning for improved adaptation  
- Multi-language support for regional accessibility  
- Mobile-first optimization  
- Integration with school systems and LMS platforms  

PLAGUE aims to transform learning into a continuously adaptive and personalized experience.

---

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
