import io
import os
import uuid
from docx import Document

def parse_docx(file_bytes: bytes, media_dir: str = "app/static/media"):
    """
    Parses a .docx file and extracts Scenarios, Questions, and embedded Images.
    """
    doc = Document(io.BytesIO(file_bytes))
    os.makedirs(media_dir, exist_ok=True)
    
    scenarios = []
    current_scenario = None
    current_question = None
    
    for para in doc.paragraphs:
        # Extract images from this paragraph
        images_in_para = []
        for run in para.runs:
            blips = run._element.xpath('.//*[local-name()="blip"]')
            for blip in blips:
                embed_id = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                if embed_id:
                    image_part = doc.part.related_parts[embed_id]
                    image_bytes = image_part.blob
                    ext = image_part.partname.split('.')[-1]
                    filename = f"{uuid.uuid4()}.{ext}"
                    filepath = os.path.join(media_dir, filename)
                    with open(filepath, "wb") as f:
                        f.write(image_bytes)
                    images_in_para.append(f"/static/media/{filename}")
        
        text = para.text.strip()
        
        if not text and images_in_para:
            # If paragraph only has images, attach them to the current question if it exists
            if current_question:
                current_question["media"].extend(images_in_para)
            continue
            
        if not text:
            continue
            
        lower_text = text.lower()
        
        if lower_text.startswith("scenario id:"):
            if current_scenario:
                if current_question:
                    current_scenario["questions"].append(current_question)
                    current_question = None
                scenarios.append(current_scenario)
            
            current_scenario = {
                "scenario_id": text.split(":", 1)[1].strip(),
                "title": "",
                "description": "",
                "questions": []
            }
        elif lower_text.startswith("title:") and current_scenario:
            current_scenario["title"] = text.split(":", 1)[1].strip()
        elif lower_text.startswith("description:") and current_scenario:
            current_scenario["description"] = text.split(":", 1)[1].strip()
        elif lower_text.startswith("question id:"):
            if current_question and current_scenario:
                current_scenario["questions"].append(current_question)
            
            current_question = {
                "question_id": text.split(":", 1)[1].strip(),
                "question": "",
                "expected_answer": "",
                "media": []
            }
            if images_in_para:
                current_question["media"].extend(images_in_para)
                
        elif lower_text.startswith("question:") and current_question:
            current_question["question"] = text.split(":", 1)[1].strip()
            if images_in_para:
                current_question["media"].extend(images_in_para)
        elif lower_text.startswith("expected answer:") and current_question:
            current_question["expected_answer"] = text.split(":", 1)[1].strip()
            if images_in_para:
                current_question["media"].extend(images_in_para)
        else:
            # If there's text but doesn't match a tag, and we have images, attach to current question
            if current_question and images_in_para:
                current_question["media"].extend(images_in_para)
                
    if current_scenario:
        if current_question:
            current_scenario["questions"].append(current_question)
        scenarios.append(current_scenario)
        
    return scenarios
