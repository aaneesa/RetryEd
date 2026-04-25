import os
from typing import List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

def generate_mindmap(raw_text: str, api_key: str = None, model: str = "gemini-2.5-flash", verbose: bool = True) -> str:
    """
    Agent 0 — Mindmap Generator
    Uses Gemini to generate a Mermaid-compatible mindmap based on the raw text.
    """
    if verbose:
        print("\n  ── Agent 0 — Mindmap Generator (Gemini) ──")

    llm = ChatGoogleGenerativeAI(
        model=model,
        google_api_key=api_key or os.getenv("GOOGLE_API_KEY"),
        temperature=0.2,
    )

    prompt = f"""
    You are an expert instructional designer. Your task is to analyze the following educational content and create a comprehensive Mindmap in Mermaid format.

    Rules for the Mermaid Mindmap:
    1. Use the 'mindmap' syntax.
    2. Start with the keyword 'mindmap' on its own line.
    3. The root node should be the main topic of the content.
    4. Use indentation (2 spaces) to show hierarchy (root -> main branches -> sub-branches).
    5. For nodes with spaces or special characters, wrap them in double quotes, e.g., "Main Topic".
    6. Focus on core concepts, definitions, and logical relationships.
    7. Return ONLY the Mermaid code block. No explanations, no preamble.

    Educational Content:
    {raw_text[:10000]}

    Mermaid Mindmap:
    """

    response = llm.invoke([HumanMessage(content=prompt)])
    
    # Clean up the response to extract only the mermaid part if LLM added extras
    content = response.content.strip()
    if "```mermaid" in content:
        content = content.split("```mermaid")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    
    if verbose:
        print(f"✅ Mindmap generated (length: {len(content)} chars)")
    
    return content
