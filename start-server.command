#!/bin/bash
cd "$(dirname "$0")"
echo "Starting local server..."
echo "Open your browser and go to: http://localhost:3000"
echo ""
echo "Press Ctrl+C in this window to stop the server."
open "http://localhost:3000"
python3 -m http.server 3000
