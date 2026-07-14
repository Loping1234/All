import win32com.client
import os

ppt_path = r"C:\Users\PRANAY\OneDrive\Documents\Task_App\Final Presentation A149 (1).pptx"
out_path = r"C:\Users\PRANAY\OneDrive\Documents\Task_App\presentation_text_extracted.txt"

try:
    ppt_app = win32com.client.Dispatch("PowerPoint.Application")
    presentation = ppt_app.Presentations.Open(ppt_path, WithWindow=False)
    
    with open(out_path, "w", encoding="utf-8") as f:
        for i, slide in enumerate(presentation.Slides):
            f.write(f"--- Slide {i+1} ---\n")
            for shape in slide.Shapes:
                if shape.HasTextFrame:
                    if shape.TextFrame.HasText:
                        f.write(shape.TextFrame.TextRange.Text + "\n")
            f.write("\n")
            
    presentation.Close()
    ppt_app.Quit()
    print("Success")
except Exception as e:
    print(f"Error: {e}")
