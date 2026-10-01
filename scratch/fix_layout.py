import re

with open('/Users/naimurrahman/Downloads/Tuition/tuition-bd/src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Replace the glass-card that contains Operator Verification
content = content.replace(
    '<div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">',
    '<div className={`glass-card rounded-2xl p-6 border border-slate-800 space-y-6 ${activeTab === "profile" ? "block" : "hidden"}`}>',
    1 # ONLY THE SECOND ONE? Wait, we already replaced the first one when we did tabs!
)

with open('/Users/naimurrahman/Downloads/Tuition/tuition-bd/src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
