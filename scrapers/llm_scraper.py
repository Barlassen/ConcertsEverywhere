import sys
import json
import requests

def parse_with_llm(filepath, artist):
    extracted_events = []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to read input file: {str(e)}"}))
        return

    for item in raw_data:
        platform = item.get('platform')
        url = item.get('url')
        text_chunk = item.get('text', '')
        
        if not text_chunk:
            continue
            
        try:
            prompt = f"""
            You are a data extraction bot. We searched for '{artist}' tickets. 
            The artist might be listed under aliases (e.g., 'Ye' instead of 'Kanye West').
            IMPORTANT: Do NOT extract events for artists with similar names (e.g., do NOT extract 'Ye Vagabonds' if we want 'Ye').
            Extract ALL upcoming events for EXACTLY this artist from the following text.
            If the text implies this is a Tribute or Cover band, set isTribute to true.
            Even if the price is missing, extract the event and set price to 0.
            Assume the current year is 2026 if the year is not specified.
            If no events are found, return [].
            Return ONLY a JSON array of objects. Do not include markdown or explanations.
            Format: [{{"price": number, "date": "YYYY-MM-DD", "venue": "string", "city": "string", "isTribute": boolean}}]
            Text: {text_chunk}
            """
            
            ollama_resp = requests.post('http://localhost:11434/api/generate', json={
                'model': 'llama3.2:latest',
                'prompt': prompt,
                'stream': False,
                'format': 'json'
            }, timeout=300)
            
            if ollama_resp.status_code == 200:
                result_text = ollama_resp.json().get('response', '[]')
                print(f"DEBUG OLLAMA RAW: {result_text}", file=sys.stderr)
                try:
                    data = json.loads(result_text)
                    if isinstance(data, dict):
                        data = [data]
                    for event in data:
                        event['url'] = url
                        # If price is missing or not a number, set it to 0 so we don't drop the event
                        if 'price' not in event or not event['price']:
                            event['price'] = 0
                            
                        if 'date' in event:
                            extracted_events.append(event)
                except json.JSONDecodeError as e:
                    print(f"JSON Parse Error from Ollama for {platform}: {str(e)}", file=sys.stderr)
            else:
                print(f"Ollama Error ({ollama_resp.status_code}): {ollama_resp.text}", file=sys.stderr)
                    
        except Exception as e:
            print(f"Request Error for URL {url}: {str(e)}", file=sys.stderr)
            continue
            
    # Output JSON for Node.js
    print(json.dumps(extracted_events))

if __name__ == '__main__':
    if len(sys.argv) > 2:
        parse_with_llm(sys.argv[1], sys.argv[2])
    else:
        print("[]")
