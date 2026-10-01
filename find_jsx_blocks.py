import os
import re

def find_blocks(directory):
    pattern = re.compile(r'\{([^{}]*?(?:parent|tutor|user)[^{}]*?)\}', re.IGNORECASE | re.DOTALL)
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = pattern.finditer(content)
                    for m in matches:
                        block = m.group(1).strip()
                        if '\n' not in block and not block.startswith('/*'):
                            print(f"{path}: {{{block}}}")

find_blocks('/Users/naimurrahman/Downloads/Tuition/tuition-bd/src/')
