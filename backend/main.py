from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreatePrompt(BaseModel):
    text: str

class UpdatePrompt(BaseModel):
    text: str
    response: str = ""

class Prompt(BaseModel):
    id: int
    text: str
    response: str = ""

prompts = []
current_id = 1

@app.get("/prompts")
def get_prompts():
    return prompts

@app.post("/prompts")
def create_prompt(prompt: CreatePrompt):
    global current_id
    new_prompt = Prompt(id=current_id, text=prompt.text)
    prompts.append(new_prompt)
    current_id += 1
    return new_prompt

@app.put("/prompts/{prompt_id}")
def update_prompt(prompt_id: int, updated_prompt: UpdatePrompt):
    for p in prompts:
        if p.id == prompt_id:
            p.text = updated_prompt.text
            p.response = updated_prompt.response
            return p
    raise HTTPException(status_code=404, detail="Prompt not found")

@app.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: int):
    global prompts
    prompts = [p for p in prompts if p.id != prompt_id]
    return {"message": "Prompt deleted"}

@app.post("/generate/{prompt_id}")
def generate_response(prompt_id: int):
    for p in prompts:
        if p.id == prompt_id:
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(p.text)
            p.response = response.text
            return p
    raise HTTPException(status_code=404, detail="Prompt not found")
