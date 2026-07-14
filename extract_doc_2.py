import win32com.client
import os

doc_path = r"c:\Users\PRANAY\OneDrive\Documents\Task_App\A149_PranayKumar_Interim_Report_I.docx"
out_path = r"c:\Users\PRANAY\OneDrive\Documents\Task_App\report_text_extracted_2.txt"

try:
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    doc = word.Documents.Open(doc_path)
    text = doc.Content.Text
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    doc.Close(False)
    word.Quit()
    print("Success")
except Exception as e:
    print(f"Error: {e}")
